import { createFieldIssue } from "@/utils/error";
import z from "zod";
import { Task } from "../types/task.types";

const createTaskSchema = z.object({
  name: z
    .string({
      error: createFieldIssue(
        "Nome da tarefa é obrigatório.",
        "Confira se o nome da tarefa foi inserido."
      ),
    })
    .max(100, {
      error: createFieldIssue(
        "O nome deve ter no máximo 100 caracteres.",
        "Reescreva o nome da tarefa de maneira mais resumida."
      ),
    }),
  description: z
    .string()
    .max(8_000, {
      error: createFieldIssue(
        "O descrição deve ter no máximo 8000 caracteres.",
        "Reescreva a descrição da tarefa de maneira mais resumida."
      ),
    })
    .optional(),
  userId: z.uuid({
    error: createFieldIssue(
      "O campo usuário é obrigatório.",
      "Confira se o usuário foi inserido."
    ),
  }),
  dueDate: z.coerce.date({
    error: createFieldIssue(
      "O prazo da tarefa é obrigatório.",
      "Confira se o prazo foi inserido."
    ),
  }),
});

const responseTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  description: z.string().nullable(),
  dueDate: z.string(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type ResponseTaskDTO = z.infer<typeof responseTaskSchema>;

export class TaskSchema {
  toCreateTaskDTO(payload: unknown) {
    return createTaskSchema.parse(payload);
  }

  toTaskRepository(task: Partial<Task>): Task {
    return {
      id: task.id ?? undefined,
      name: task.name ?? undefined,
      userId: task.userId ?? undefined,
      description: task.description ?? undefined,
      dueDate: task.dueDate ?? undefined,
      finishedAt: task.finishedAt ?? undefined,
      createdAt: task.createdAt ?? undefined,
      updatedAt: task.updatedAt ?? undefined,
    };
  }

  toResponseDTO(task: Task) {
    const response: ResponseTaskDTO = {
      ...task,
      finishedAt: task.finishedAt?.toISOString() || null,
      dueDate: task.dueDate.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
    return responseTaskSchema.parse(response);
  }
}

export const taskSchema = new TaskSchema();
