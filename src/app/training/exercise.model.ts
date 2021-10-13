export interface Exercise {
  id: string;
  name: string;
  duration: number;
  calories: number;
  url: string;
  userId?: string;
  date?: Date;
  state?: 'completed' | 'cancelled' | null;
}
