import { UserService } from "@/app/users/services/user.service";
import { canRequest, createEndpointWithUser, onError } from "@/utils/api";
import { NextRequest, NextResponse } from "next/server";

const endpointBuilder = createEndpointWithUser();

export const { POST } = endpointBuilder
  .post(canRequest("create:user"), postHandler)
  .build({ onError });

async function postHandler(req: NextRequest) {
  const userService = new UserService();
  const createdUser = await userService.create(await req.json());
  return NextResponse.json(createdUser, { status: 201 });
}
