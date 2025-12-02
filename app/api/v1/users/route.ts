import { UserService } from "@/app/users/services/user.service";
import { createEndpoint } from "@/lib/api-middleware";
import { NextRequest, NextResponse } from "next/server";

export const POST = createEndpoint(postHandler);

async function postHandler(req: NextRequest) {
  const userService = new UserService();
  const createdUser = await userService.create(await req.json());
  return NextResponse.json(createdUser, { status: 201 });
}
