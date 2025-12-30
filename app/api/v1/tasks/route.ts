import { NextRequestWithContext } from "@/@types/api";
import { TaskService } from "@/app/tasks/services/task.service";
import { canRequest, createEndpointWithUser, onError } from "@/utils/api";
import { NextResponse } from "next/server";

const endpointBuilder = createEndpointWithUser();
const taskService = new TaskService();

endpointBuilder.post(canRequest("create:task"), postHandler);

export const { POST } = endpointBuilder.build({ onError });

async function postHandler(req: NextRequestWithContext) {
  const body = await req.json();
  const user = req.context.user || {};
  const userId = "id" in user ? user.id : "";
  body.userId = userId;
  const createdTask = await taskService.create(body);
  return NextResponse.json(createdTask, { status: 201 });
}
