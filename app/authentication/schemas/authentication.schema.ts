import z from "zod";

const loginschema = z.object({
  email: z.string().default(""),
  password: z.string().default(""),
});

export type AuthenticationDTO = z.infer<typeof loginschema>;

export class AuthenticationSchema {
  toAuthenticationDTO(body: unknown) {
    return loginschema.parse(body);
  }
}
