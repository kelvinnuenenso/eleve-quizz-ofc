// Teste da API consolidada
// Node.js 18+ tem fetch nativo

// Configuração
const API_BASE = 'http://localhost:8080/api';
const TEST_USER = {
  email: 'teste@exemplo.com',
  password: 'senha123456',
  name: 'Usuário Teste'
};

async function testAPI() {
  console.log('🧪 Testando API consolidada...');
  
  try {
    // 1. Teste de Health Check
    console.log('\n1. Testando Health Check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    
    // 2. Teste de criação de usuário
    console.log('\n2. Testando criação de usuário...');
    const userResponse = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });
    
    const userData = await userResponse.json();
    console.log('📝 Resposta criação usuário:', userData);
    
    if (userData.success) {
      console.log('✅ Usuário criado com sucesso!');
    } else {
      console.log('❌ Erro na criação do usuário:', userData.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };