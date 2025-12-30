export type Task = {
  id: string;
  name: string;
  userId: string;
  description: string | null;
  dueDate: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
