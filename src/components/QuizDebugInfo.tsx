import { useState } from 'react';
import { Quiz } from '@/types/quiz';

interface QuizDebugInfoProps {
  quiz: Quiz | null;
}

export function QuizDebugInfo({ quiz }: QuizDebugInfoProps) {
  const [expanded, setExpanded] = useState(false);

  if (!quiz) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <div className="font-bold text-red-800">Quiz Debug Info: No quiz data</div>
      </div>
    );
  }

  const validationErrors = validateQuiz(quiz);

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded">
      <div 
        className="font-bold text-blue-800 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Quiz Debug Info</span>
        <span>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="mt-2 text-sm space-y-2">
          <div><strong>ID:</strong> {quiz.id}</div>
          <div><strong>Public ID:</strong> {quiz.publicId || 'Not set'}</div>
          <div><strong>Name:</strong> {quiz.name || 'Not set'}</div>
          <div><strong>Status:</strong> {quiz.status}</div>
          <div><strong>Steps Count:</strong> {quiz.steps?.length || 0}</div>
          <div><strong>Questions Count:</strong> {quiz.questions?.length || 0}</div>
          
          {validationErrors.length > 0 && (
            <div className="bg-red-200 p-2 rounded">
              <div className="font-bold text-red-800">Validation Errors:</div>
              <ul className="list-disc pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-red-700">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <details>
            <summary className="cursor-pointer font-medium">Full Quiz Data</summary>
            <pre className="text-xs bg-white p-2 rounded mt-1 max-h-40 overflow-auto">
              {JSON.stringify(quiz, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function validateQuiz(quiz: Quiz): string[] {
  const errors: string[] = [];
  
  if (!quiz.id) {
    errors.push('Quiz ID is required');
  }
  
  if (!quiz.name?.trim()) {
    errors.push('Quiz name is required');
  }
  
  if (!quiz.steps || quiz.steps.length === 0) {
    errors.push('At least one step is required');
  }
  
  // Validate each step
  quiz.steps?.forEach((step, index) => {
    if (!step.id) {
      errors.push(`Step ${index + 1} ID is required`);
    }
    
    if (!step.name?.trim()) {
      errors.push(`Step ${index + 1} name is required`);
    }
    
    if (!step.type) {
      errors.push(`Step ${index + 1} type is required`);
    }
  });
  
  return errors;
}