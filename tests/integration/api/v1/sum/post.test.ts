import prisma from "lib/prisma";

describe("[POST] /api/v1/sum", () => {
  test("Sending only numbers in body", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sum", {
      method: "POST",
      body: JSON.stringify([1, 2, 3, 4, 5]),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      result: 15,
    });
    expect(await prisma.test.findMany()).toHaveLength(1);
  });
  test("Sending not numbers in body", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sum", {
      method: "POST",
      body: JSON.stringify([1, "show", 3, 4, "daora"]),
    });
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      status_code: 400,
      message: "Você é burro? Como que vou somar uma palavra/letra?",
      action: "Remove tudo que não for número, seu cavalo",
      error: "ValidationError",
    });
  });
});
