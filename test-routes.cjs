// Teste simples de rotas usando fetch
const baseUrl = 'http://localhost:8080';

// Lista de rotas para testar
const routes = [
  { path: '/', name: 'Home/Landing Page', public: true },
  { path: '/auth', name: 'Authentication Page', public: true },
  { path: '/auth/callback', name: 'Auth Callback', public: true },
  { path: '/dashboard', name: 'Dashboard (Protected)', public: false },
  { path: '/app', name: 'App Dashboard (Protected)', public: false },
  { path: '/quiz/editor', name: 'Quiz Editor (Protected)', public: false },
  { path: '/settings', name: 'Settings (Protected)', public: false },
  { path: '/templates', name: 'Templates (Protected)', public: false },
  { path: '/nonexistent-route-test', name: 'Non-existent Route', public: true, expect404: true }
];

async function testRoute(route) {
  try {
    console.log(`\n🔍 Testando: ${route.name} (${route.path})`);
    
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const statusCode = response.status;
    const contentType = response.headers.get('content-type') || '';
    
    console.log(`   📊 Status: ${statusCode}`);
    console.log(`   📄 Content-Type: ${contentType}`);
    
    if (statusCode === 200) {
      const text = await response.text();
      
      // Verificar se é uma página React/HTML válida
      if (text.includes('<div id="root">') || text.includes('id="root"')) {
        console.log('   ✅ Página HTML com root React encontrada');
      } else {
        console.log('   ⚠️ Página HTML sem root React');
      }
      
      // Verificar se contém scripts React/Vite
      if (text.includes('vite') || text.includes('react')) {
        console.log('   ✅ Scripts React/Vite detectados');
      }
      
      // Verificar título da página
      const titleMatch = text.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        console.log(`   📋 Título: ${titleMatch[1]}`);
      }
      
      // Para rotas protegidas, verificar se há redirecionamento via JavaScript
      if (!route.public && text.includes('useAuth')) {
        console.log('   ✅ Hook de autenticação detectado (rota protegida)');
      }
      
    } else if (statusCode === 404) {
      if (route.expect404) {
        console.log('   ✅ 404 esperado e recebido');
      } else {
        console.log('   ❌ 404 inesperado');
      }
    } else {
      console.log(`   ⚠️ Status inesperado: ${statusCode}`);
    }
    
    return { route: route.path, status: statusCode, success: statusCode === 200 || (statusCode === 404 && route.expect404) };
    
  } catch (error) {
    console.log(`   ❌ Erro ao testar rota: ${error.message}`);
    return { route: route.path, status: 'ERROR', success: false, error: error.message };
  }
}

async function checkServer() {
  try {
    console.log('🔍 Verificando se o servidor está rodando...');
    const response = await fetch(baseUrl, { method: 'HEAD' });
    console.log('✅ Servidor está rodando em', baseUrl);
    return true;
  } catch (error) {
    console.log('❌ Servidor não está rodando em', baseUrl);
    console.log('   Por favor, execute "npm run dev" primeiro');
    console.log('   Erro:', error.message);
    return false;
  }
}

async function testAllRoutes() {
  console.log('🚀 Iniciando teste de rotas...');
  console.log('🌐 URL base:', baseUrl);
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    return;
  }
  
  console.log('\n📋 Testando rotas:');
  
  const results = [];
  
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Resumo dos testes:');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.route} - Status: ${result.status}`);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }
  });
  
  console.log('=' .repeat(50));
  console.log(`📈 Sucessos: ${successCount}/${results.length}`);
  console.log(`📉 Erros: ${errorCount}/${results.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Todos os testes passaram!');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
  
  console.log('\n💡 Dicas:');
  console.log('- Rotas protegidas devem carregar mas redirecionar via JavaScript');
  console.log('- Todas as rotas devem retornar HTML com root React');
  console.log('- Teste manualmente no navegador para verificar redirecionamentos');
  
  console.log('\n✨ Teste de rotas concluído!');
}

// Executar o teste
testAllRoutes().catch(console.error);