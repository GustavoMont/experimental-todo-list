import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  let result = 0;
  for (const number of body) {
    const convertedNumber = Number(number);
    if (isNaN(convertedNumber))
      return NextResponse.json(
        {
          status_code: 400,
          message: "Você é burro? Como que vou somar uma palavra/letra?",
          action: "Remove tudo que não for número, seu cavalo",
          error: "BadRequestError",
        },
        { status: 400 }
      );
    result += convertedNumber;
  }

  return NextResponse.json({ result }, { status: 200 });
}
