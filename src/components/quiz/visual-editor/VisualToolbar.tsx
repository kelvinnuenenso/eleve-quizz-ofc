import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Quiz } from '@/types/quiz';
import { Save, Eye, Undo2, Redo2, RefreshCw, Upload } from 'lucide-react';

interface VisualToolbarProps {
  quiz: Quiz;
  isDirty: boolean;
  autoSaving?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  componentCount: number;
  onUpdateName: (name: string) => void;
  onSave: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSyncWithQuestions?: () => void;
  onPublish?: () => void;
}

export function VisualToolbar({
  quiz,
  isDirty,
  autoSaving = false,
  canUndo,
  canRedo,
  componentCount,
  onUpdateName,
  onSave,
  onPreview,
  onUndo,
  onRedo,
  onSyncWithQuestions,
  onPublish
}: VisualToolbarProps) {
  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input 
              value={quiz.name} 
              onChange={(e) => onUpdateName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0" 
              placeholder="Nome do projeto"
            />
            {quiz.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {quiz.description}
              </p>
            )}
          </div>
          
          <Badge variant={quiz.status === 'published' ? 'default' : 'secondary'}>
            {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
          </Badge>

          {/* Undo/Redo Controls */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title="Desfazer"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title="Refazer"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            {/* Sincronizar com Perguntas */}
            {onSyncWithQuestions && quiz.questions && quiz.questions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncWithQuestions}
                className="ml-2"
                title="Sincronizar com perguntas da aba Perguntas"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!isDirty || autoSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {autoSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          
          {onPublish && (
            <Button
              variant="default"
              size="sm"
              onClick={onPublish}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={onPreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        </div>
      </div>
    </div>
  );
}