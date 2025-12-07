import { ValidationError } from "@/infra/errors";
import z, { ZodError } from "zod";

export function createFieldIssue(message: string, action: string) {
  return JSON.stringify({ message, action });
}

export function formatZodError(error: ZodError) {
  const errorMessageFormat = z.object({
    message: z.stringFormat(
      "message-object",
      /\{['"](action|message)['"]:.*,\s*['"](action|message)['"]:.*\}/
    ),
  });
  const issues = error.issues.map(({ message, path }) => {
    const [field] = path as string[];
    const validationResult = errorMessageFormat.safeParse({ message });

    if (validationResult.error) {
      return {
        field,
        message,
        action: "Verifique se foi digitado corretamente.",
      };
    }
    const errorMessage = JSON.parse(message) as {
      message: string;
      action: string;
    };

    return {
      field,
      ...errorMessage,
    };
  });

  return new ValidationError({ cause: error, issues });
}
