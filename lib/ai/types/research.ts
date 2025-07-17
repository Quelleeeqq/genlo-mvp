// Research-related type definitions

export type ResearchTask = {
  topic: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}; 