import { Quiz } from '@/types/quiz';

// Mock quiz data for local development and testing
export const mockQuizData: Quiz = {
  id: 'mock-quiz-1',
  publicId: 'mock-quiz-1',
  name: 'Quiz de Exemplo',
  description: 'Este é um quiz de exemplo para testes locais',
  status: 'published',
  theme: {
    primary: '#2563EB',
    background: '#FFFFFF',
    text: '#1F2937',
    showProgress: true,
    fakeProgress: false,
  },
  settings: {},
  questions: [
    {
      id: 'q1',
      idx: 1,
      type: 'single',
      title: 'Qual é a sua cor favorita?',
      options: [
        { id: '1', label: 'Vermelho', score: 10 },
        { id: '2', label: 'Azul', score: 5 },
        { id: '3', label: 'Verde', score: 8 },
        { id: '4', label: 'Amarelo', score: 3 }
      ],
      required: true
    },
    {
      id: 'q2',
      idx: 2,
      type: 'single',
      title: 'Qual é o seu animal favorito?',
      options: [
        { id: '1', label: 'Cachorro', score: 10 },
        { id: '2', label: 'Gato', score: 5 },
        { id: '3', label: 'Pássaro', score: 8 },
        { id: '4', label: 'Peixe', score: 3 }
      ],
      required: true
    }
  ],
  outcomes: {
    'outcome-1': {
      title: 'Resultado A',
      description: 'Você tem um perfil A!',
      cta: {
        label: 'Saiba mais',
        href: 'https://example.com'
      },
      scoreRange: { min: 0, max: 10 },
      color: '#2563EB'
    },
    'outcome-2': {
      title: 'Resultado B',
      description: 'Você tem um perfil B!',
      cta: {
        label: 'Saiba mais',
        href: 'https://example.com'
      },
      scoreRange: { min: 11, max: 20 },
      color: '#DC2626'
    }
  },
  pixelSettings: {},
  redirectSettings: {
    enabled: true,
    redirect_type: 'url',
    url: 'https://example.com'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};