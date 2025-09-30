import { Quiz, Result, Lead } from '@/types/quiz';
import { localDB } from './localStorage';

export async function saveQuiz(quiz: Quiz): Promise<Quiz> {
  localDB.saveQuiz(quiz);
  return quiz;
}

export async function loadQuizByPublicId(publicId: string): Promise<Quiz | null> {
  return localDB.getQuizByPublicId(publicId);
}

export async function loadQuiz(id: string): Promise<Quiz | null> {
  return localDB.getQuiz(id);
}

export async function listQuizzes(): Promise<Quiz[]> {
  return localDB.getAllQuizzes();
}

export async function deleteQuiz(id: string): Promise<void> {
  localDB.deleteQuiz(id);
}

export async function saveResult(result: Result): Promise<void> {
  localDB.saveResult(result);
}

export async function saveLead(lead: Lead): Promise<void> {
  localDB.saveLead(lead);  
}

export async function getResult(id: string): Promise<Result | null> {
  return localDB.getResult(id);
}