import { createUser } from "@/tests/orchestrator";

describe("[POST] /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "username",
          email: "email@email.com",
          password: "supersenha",
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "username",
        email: "email@email.com",
        password: "supersenha",
        createdAt: responseBody.createdAt,
        updatedAt: responseBody.updatedAt,
      });
      expect(Date.parse(responseBody.createdAt)).not.toBeNaN();
      expect(Date.parse(responseBody.updatedAt)).not.toBeNaN();
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
          password: "supersenha",
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
          password: "supersenha",
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
