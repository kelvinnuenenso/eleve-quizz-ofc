// Script para forçar limpeza completa do cache e recarregamento
(async function forceClearAndRefresh() {
    console.log('🧹 Iniciando limpeza completa do cache...');
    
    try {
        // 1. Limpar localStorage
        console.log('📦 Limpando localStorage...');
        localStorage.clear();
        
        // 2. Limpar sessionStorage
        console.log('📦 Limpando sessionStorage...');
        sessionStorage.clear();
        
        // 3. Limpar todos os caches
        if ('caches' in window) {
            console.log('🗂️ Limpando caches...');
            const cacheNames = await caches.keys();
            console.log(`Encontrados ${cacheNames.length} caches:`, cacheNames);
            
            await Promise.all(
                cacheNames.map(async (cacheName) => {
                    console.log(`Removendo cache: ${cacheName}`);
                    return caches.delete(cacheName);
                })
            );
            console.log('✅ Todos os caches removidos!');
        }
        
        // 4. Desregistrar todos os service workers
        if ('serviceWorker' in navigator) {
            console.log('⚙️ Desregistrando service workers...');
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Encontrados ${registrations.length} service workers`);
            
            await Promise.all(
                registrations.map(async (registration) => {
                    console.log('Desregistrando service worker:', registration.scope);
                    return registration.unregister();
                })
            );
            console.log('✅ Todos os service workers desregistrados!');
        }
        
        // 5. Forçar recarregamento completo
        console.log('🔄 Forçando recarregamento completo...');
        
        // Aguardar um pouco para garantir que tudo foi limpo
        setTimeout(() => {
            // Recarregar com bypass de cache
            window.location.reload(true);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro durante limpeza:', error);
        // Mesmo com erro, tentar recarregar
        setTimeout(() => {
            window.location.reload(true);
        }, 2000);
    }
})();

// Função para executar manualmente
window.forceClearCache = async function() {
    console.log('🧹 Limpeza manual iniciada...');
    
    // Limpar storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpar caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Desregistrar service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
    }
    
    alert('Cache limpo! A página será recarregada.');
    window.location.reload(true);
};

console.log('💡 Para limpar manualmente, execute: forceClearCache()');