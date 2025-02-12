export interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  memo: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: Date | null;
  completed: boolean;
}

export interface TimeRecord {
  id: string;
  date: string;
  time: string;
  type: 'clockIn' | 'clockOut' | 'breakStart' | 'breakEnd';
  is_night_shift?: boolean;
}