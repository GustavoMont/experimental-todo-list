import { ValidationError } from "@/infra/errors";
import { createEndpoint } from "@/lib/api-middleware";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const POST = createEndpoint(postHandler);

async function postHandler(request: NextRequest) {
  const body = await request.json();
  let result = 0;
  await prisma.test.create({ data: { isCoiso: true } });
  for (const number of body) {
    const convertedNumber = Number(number);
    if (isNaN(convertedNumber)) {
      const validationError = new ValidationError({
        action: "Remove tudo que não for número, seu cavalo",
        message: "Você é burro? Como que vou somar uma palavra/letra?",
      });
      return NextResponse.json(validationError.toJSON(), {
        status: validationError.statusCode,
      });
    }
    result += convertedNumber;
  }

  return NextResponse.json({ result }, { status: 200 });
}
