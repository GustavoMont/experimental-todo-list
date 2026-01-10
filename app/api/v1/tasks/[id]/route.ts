import { NextRequestWithContext } from "@/@types/api";
import { authorizationService } from "@/app/authorization/services/authorization.service";
import { TaskService } from "@/app/tasks/services/task.service";
import { ForbiddenError, NotFoundError } from "@/infra/errors";
import { Context } from "@/lib/endpoint-builder";
import {
  canRequest,
  createEndpointWithUser,
  generateAnonymousUser,
  onError,
} from "@/utils/api";
import { NextResponse } from "next/server";

const endpointBuilder = createEndpointWithUser();
const taskService = new TaskService();

endpointBuilder.get(canRequest("view:task"), getHandler);
endpointBuilder.patch(canRequest("update:task"), patchHandler);
endpointBuilder.delete(canRequest("delete:task"), deleteHandler);

export const { GET, PATCH, DELETE } = endpointBuilder.build({ onError });

async function getHandler(
  req: NextRequestWithContext,
  { params }: Context<{ id: string }>
) {
  const { id } = await params;

  try {
    const task = await taskService.findById(id);
    const requestUser = req.context.user ?? generateAnonymousUser();
    const canView = authorizationService.can(requestUser, "view:task", task);
    if (!canView) {
      throw new ForbiddenError({
        message:
          "Você não tem permissão para visualizar tarefa de outros usuários.",
        action: "Verifique se você tem a permissão necessária.",
      });
    }
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw new ForbiddenError({
        message: "Você não tem permissão para visualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        cause: error,
      });
    }

    throw error;
  }
}

async function patchHandler(
  req: NextRequestWithContext,
  { params }: Context<{ id: string }>
) {
  const { id } = await params;

  try {
    const task = await taskService.findById(id);
    const requestUser = req.context.user ?? generateAnonymousUser();
    const canView = authorizationService.can(requestUser, "view:task", task);
    if (!canView) {
      throw new ForbiddenError({
        message:
          "Você não tem permissão para atualizar tarefa de outros usuários.",
        action: "Verifique se você tem a permissão necessária.",
      });
    }
    const updatedTask = await taskService.update(id, await req.json());
    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw new ForbiddenError({
        message: "Você não tem permissão para atualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        cause: error,
      });
    }

    throw error;
  }
}

async function deleteHandler(
  req: NextRequestWithContext,
  { params }: Context<{ id: string }>
) {
  const { id } = await params;

  try {
    const task = await taskService.findById(id);
    const requestUser = req.context.user ?? generateAnonymousUser();
    const canDelete = authorizationService.can(
      requestUser,
      "delete:task",
      task
    );
    if (!canDelete) {
      throw new ForbiddenError({
        message:
          "Você não tem permissão para deletar tarefa de outros usuários.",
        action: "Verifique se você tem a permissão necessária.",
      });
    }
    await taskService.deleteById(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw new ForbiddenError({
        message: "Você não tem permissão para deletar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        cause: error,
      });
    }

    throw error;
  }
}
