import { PrismaError, prismaErros } from "./prisma/errors";

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

export class BaseError extends Error {
  readonly name: string;
  public readonly action: string;
  public readonly statusCode: number;
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

export class InternalServerError extends BaseError {
  stackTrace;
  constructor({
    action,
    cause,
    message,
  }: Partial<Pick<BaseErrorParams, "action" | "cause" | "message">>) {
    if (prismaErros.some((prismaError) => cause instanceof prismaError)) {
      const prismaError = cause as PrismaError;
      cause = prismaError.message
        ? `${prismaError?.message}\n\n${prismaError.stack.slice(0, 2_000)}`
        : "Deu erro no prisma";
    }

    super({
      name: "InternalServerErro",
      action: action || "Contate o time de suporte",
      cause,
      message: message || "Ocorreu um erro inesperado.",
      statusCode: 500,
    });
  }
}

export class NotImplementedError extends BaseError {
  constructor({
    action,
    cause,
    message,
  }: Partial<Pick<BaseErrorParams, "action" | "cause" | "message">>) {
    super({
      action: action || "Aguarde por noitícias ou contate o time de suporte.",
      cause,
      message:
        message || "Essa função ainda não está devidamente implementada.",
      name: "NotImplementedError",
      statusCode: 501,
    });
  }
}
