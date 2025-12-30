import { CreateTaskDTO, taskSchema, TaskSchema } from "../schemas/task.schema";
import { TaskRepository } from "../repositories/task.repository";

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
}
