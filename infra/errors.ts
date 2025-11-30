type Issues = {
  message: string;
  action: string;
  field?: string;
};

type BaseErrorParams = {
  name: string;
  cause: unknown;
  message: string;
  action: string;
  statusCode: number;
  issues?: Issues[];
};

class BaseError extends Error {
  readonly name: string;
  public readonly action: string;
  public readonly statusCode: number;
  public readonly cause: unknown;
  public readonly issues: Issues[];

  constructor({
    name,
    action,
    cause,
    message,
    statusCode,
    issues,
  }: BaseErrorParams) {
    super(message, { cause });
    this.name = name;
    this.action = action;
    this.statusCode = statusCode;
    this.issues = issues;
  }

  toJSON() {
    return {
      error: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
      issues: this.issues,
    };
  }
}

export class ValidationError extends BaseError {
  constructor({
    action,
    cause,
    message,
    issues,
  }: Partial<
    Pick<BaseErrorParams, "action" | "cause" | "message" | "issues">
  >) {
    super({
      cause,
      action:
        action ||
        "Confira todos os dados enviados ou contate o time de suporte.",
      message: message || "Os dados enviados estão inválidos.",
      name: "ValidationError",
      statusCode: 400,
      issues,
    });
  }
}
