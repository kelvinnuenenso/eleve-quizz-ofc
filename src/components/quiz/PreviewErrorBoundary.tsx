import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Preview Error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[600px] flex items-center justify-center p-4">
          <Card className="p-8 max-w-2xl w-full">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold mb-2">Erro no Preview</h2>
              <p className="text-muted-foreground mb-6">
                Ocorreu um erro ao carregar o preview do quiz.
              </p>
              
              {/* Informações do erro */}
              <div className="bg-muted/50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-60">
                <h3 className="font-semibold mb-2 text-sm">Detalhes do erro:</h3>
                <pre className="text-xs text-destructive font-mono">
                  {this.state.error?.toString()}
                </pre>
                
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-xs font-semibold cursor-pointer hover:text-primary">
                      Stack trace (clique para expandir)
                    </summary>
                    <pre className="text-xs mt-2 text-muted-foreground font-mono whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              {/* Possíveis soluções */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-left mb-6">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <span>💡</span> Possíveis soluções:
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Verifique se todas as etapas do quiz têm componentes válidos</li>
                  <li>• Certifique-se de que o tema do quiz está configurado corretamente</li>
                  <li>• Tente criar uma nova etapa e adicionar componentes básicos</li>
                  <li>• Se o problema persistir, recarregue a página</li>
                </ul>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                >
                  Tentar Novamente
                </Button>
              </div>

              {/* Informação adicional */}
              <p className="text-xs text-muted-foreground mt-6">
                Se o erro persistir, abra o Console do navegador (F12) para mais detalhes
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
