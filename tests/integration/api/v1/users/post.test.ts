import { createUser } from "@/tests/orchestrator";

describe("[POST] /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "username",
          email: "email@email.com",
          password: "sup3rs3nha",
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "username",
        email: "email@email.com",
        password: "sup3rs3nha",
        createdAt: responseBody.createdAt,
        updatedAt: responseBody.updatedAt,
      });
      expect(Date.parse(responseBody.createdAt)).not.toBeNaN();
      expect(Date.parse(responseBody.updatedAt)).not.toBeNaN();
    });
    test("With invalid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "a_ ",
          email: "a",
          password: "1234",
        }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Os dados enviados estão inválidos.",
        action: "Confira todos os dados enviados ou contate o time de suporte.",
        issues: responseBody.issues,
        status_code: 400,
      });

      expect(responseBody.issues).toEqual([
        {
          field: "email",
          message: "E-mail inválido.",
          action: "Confira se digitou o e-mail corretamente.",
        },
        {
          field: "username",
          message: "Username inválido.",
          action:
            "Use um username com no mínimo 3 letras e sem caracteres especiais.",
        },
        {
          field: "password",
          message: "Senha muito fraca.",
          action: "A senha no mínimo 10 caracteres e conter letras e números.",
        },
      ]);
    });
    test("With duplicated 'email'", async () => {
      await createUser({
        email: "email@duplicado.com",
      });
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "new_username",
          email: "email@duplicado.com",
          password: "sup3rs3nha",
        }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "E-mail já cadastrado no sistema.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      await createUser({
        username: "username_duplicado",
      });
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          email: "new_email@email.com",
          username: "username_duplicado",
          password: "sup3rs3nha",
        }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Username já cadastrado no sistema.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
