import { UserService } from "@/app/users/services/user.service";

import { EndpointBuilder } from "@/lib/endpoint-builder";
import { onError } from "@/utils/api";
import { NextRequest, NextResponse } from "next/server";

const endpointBuilder = new EndpointBuilder();

export const { POST } = endpointBuilder.post(postHandler).build({ onError });

async function postHandler(req: NextRequest) {
  const userService = new UserService();
  const createdUser = await userService.create(await req.json());
  return NextResponse.json(createdUser, { status: 201 });
}
