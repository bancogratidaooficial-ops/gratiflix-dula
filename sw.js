const CACHE_NAME = 'dolafilmes-v3';
const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 📥 Instalar — salva os arquivos no cache
self.addEventListener('install', e => {
  console.log('📦 Instalando Service Worker...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberto');
        return cache.addAll(ARQUIVOS_CACHE);
      })
      .then(() => {
        console.log('✅ Arquivos cacheados com sucesso!');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch(err => console.log('⚠️ Erro no cache:', err))
  );
});

// 🔄 Ativar — limpa caches antigos
self.addEventListener('activate', e => {
  console.log('🚀 Service Worker ativado!');
  e.waitUntil(
    caches.keys().then(nomesCaches => {
      return Promise.all(
        nomesCaches.filter(nome => nome !== CACHE_NAME)
          .map(nomeAntigo => {
            console.log(`🗑️ Apagando cache antigo: ${nomeAntigo}`);
            return caches.delete(nomeAntigo);
          })
      );
    }).then(() => self.clients.claim()) // Assume controle de todas as abas
  );
});

// 🌐 Buscar — rede primeiro, depois cache
self.addEventListener('fetch', e => {
  // Apenas requisições GET
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request)
      .then(respostaRede => {
        // Se conseguiu da rede, salva no cache
        const respostaParaCache = respostaRede.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, respostaParaCache);
        });
        return respostaRede;
      })
      .catch(() => {
        // Sem internet → busca do cache
        console.log(`📂 Carregando do cache: ${e.request.url}`);
        return caches.match(e.request).then(respostaCache => {
          return respostaCache || new Response('Sem conexão e arquivo não em cache 😕');
        });
      })
  );
});
