// Cliente para comunicação com a API interna do quiz
// Em produção, usa as APIs serverless da Vercel
// Em desenvolvimento, pode usar o servidor Express local ou as APIs serverless
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : (process.env.NEXT_PUBLIC_USE_LOCAL_API === 'true' ? 'http://localhost:3001/api' : '/api');

export interface QuizResposta {
  quiz_id: string;
  usuario_id?: string;
  respostas: Record<string, any>;
  pontuacao?: number;
}

export interface QuizResultado {
  quiz_id: string;
  total_tentativas: number;
  pontuacao_media: number;
  pontuacao_maxima: number;
  pontuacao_minima: number;
}

export interface RespostaDetalhada {
  id: number;
  quiz_id: string;
  usuario_id?: string;
  respostas: Record<string, any>;
  pontuacao: number;
  data_criacao: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw error;
    }
  }

  // Salvar respostas do quiz
  async salvarRespostas(dados: QuizResposta): Promise<{ success: boolean; id: number; message: string }> {
    return this.request('/quiz/respostas', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  }

  // Obter estatísticas gerais ou de um quiz específico
  async obterResultados(quiz_id?: string): Promise<{ success: boolean; resultados: QuizResultado[] }> {
    const params = quiz_id ? `?quiz_id=${encodeURIComponent(quiz_id)}` : '';
    return this.request(`/quiz/resultados${params}`);
  }

  // Buscar respostas detalhadas de um quiz
  async buscarRespostas(
    quiz_id: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ success: boolean; respostas: RespostaDetalhada[] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.request(`/quiz/respostas/${encodeURIComponent(quiz_id)}?${params}`);
  }

  // Health check da API
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return this.request('/health');
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient();

// Hook personalizado para usar com React Query (opcional)
export const useQuizApi = () => {
  return {
    salvarRespostas: apiClient.salvarRespostas.bind(apiClient),
    obterResultados: apiClient.obterResultados.bind(apiClient),
    buscarRespostas: apiClient.buscarRespostas.bind(apiClient),
    healthCheck: apiClient.healthCheck.bind(apiClient),
  };
};

// Utilitários para tratamento de erros
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido na API';
};

// Função para verificar se a API está disponível
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    await apiClient.healthCheck();
    return true;
  } catch {
    return false;
  }
};