import {
  CreateTaskDTO,
  ResponseTaskDTO,
  taskSchema,
  TaskSchema,
} from "../schemas/task.schema";
import { TaskRepository } from "../repositories/task.repository";
import { NotFoundError } from "@/infra/errors";
import z from "zod";
import { TaskFilters } from "../types/task.types";

export class TaskService {
  private readonly schema: TaskSchema;
  private readonly taskRepository: TaskRepository;
  constructor() {
    this.schema = taskSchema;
    this.taskRepository = new TaskRepository();
  }

  async create(data: CreateTaskDTO) {
    const validatedTask = this.schema.toCreateTaskDTO(data);
    const creationData = this.schema.toTaskRepository(validatedTask);
    const createdTask = await this.taskRepository.create(creationData);
    return this.schema.toResponseDTO(createdTask);
  }

  async findMany(where: TaskFilters = {}) {
    const tasks = await this.taskRepository.findMany(where);
    return tasks.map(this.schema.toResponseDTO);
  }

  async findById(id: string): Promise<ResponseTaskDTO> {
    const notFoundError = new NotFoundError({
      action: "Verifique se o id informado está correto.",
      message: "Tarefa não encontrada",
    });
    if (!z.uuidv4(id).safeParse(id).success) throw notFoundError;
    const task = await this.taskRepository.findById(id);
    if (!task) throw notFoundError;
    return this.schema.toResponseDTO(task);
  }

  async deleteById(id: string): Promise<void> {
    await this.taskRepository.deleteById(id);
  }
}
