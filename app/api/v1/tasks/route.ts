import { NextRequestWithContext } from "@/@types/api";
import { authorizationService } from "@/app/authorization/services/authorization.service";
import { TaskService } from "@/app/tasks/services/task.service";
import { TaskFilters } from "@/app/tasks/types/task.types";
import { canRequest, createEndpointWithUser, onError } from "@/utils/api";
import { NextResponse } from "next/server";

const endpointBuilder = createEndpointWithUser();
const taskService = new TaskService();

endpointBuilder.get(canRequest("view:task"), getHandler);
endpointBuilder.post(canRequest("create:task"), postHandler);

export const { GET, POST } = endpointBuilder.build({ onError });

async function getHandler(req: NextRequestWithContext) {
  const user = req.context.user || { features: [] };
  const userId = "id" in user ? user.id : "";
  const canViewAnotherUserTasks = authorizationService.can(
    user,
    "view:task:others"
  );
  const filters: TaskFilters = canViewAnotherUserTasks ? {} : { userId };
  const tasks = await taskService.findMany(filters);

  return NextResponse.json(tasks, { status: 200 });
}

async function postHandler(req: NextRequestWithContext) {
  const body = await req.json();
  const user = req.context.user || {};
  const userId = "id" in user ? user.id : "";
  body.userId = userId;
  const createdTask = await taskService.create(body);
  return NextResponse.json(createdTask, { status: 201 });
}
