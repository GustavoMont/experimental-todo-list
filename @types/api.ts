import { UserResponseDTO } from "@/app/users/schemas/user.schema";
import { NextRequest } from "next/server";

export type RequestUser = UserResponseDTO | { features: string[] };

export type RequestContext = Partial<{
  user: RequestUser;
}>;

export type NextRequestWithContext = NextRequest & {
  context?: RequestContext;
};
