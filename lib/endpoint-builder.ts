import { NextRequest, NextResponse } from "next/server";
import { NotImplementedError } from "@/infra/errors";

export class EndpointBuilder {
  private commonMiddlewares: MiddlewareFn[] = [];
  private middlewares: EndpointMiddlewares = {};

  use(...middlewares: MiddlewareFn[]) {
    this.commonMiddlewares = this.commonMiddlewares.concat(middlewares);
    return this;
  }

  post(...middlewares: MiddlewareFn[]) {
    this.setEndpoint("POST", middlewares);
    return this;
  }

  delete(...middlewares: MiddlewareFn[]) {
    this.setEndpoint("DELETE", middlewares);
    return this;
  }

  build(buildOptions: BuildOptions = {}): EndpointMethods {
    const methods: AllowedMethods[] = Object.keys(
      this.middlewares
    ) as AllowedMethods[];
    const endpoints: EndpointMethods = methods.reduce<EndpointMethods>(
      (acc, current) => {
        acc[current] = this.createEndpoint(
          this.middlewares[current],
          buildOptions
        );
        return acc;
      },
      {}
    );
    return endpoints;
  }

  private setEndpoint(method: AllowedMethods, middlewares: MiddlewareFn[]) {
    this.middlewares[method] = middlewares;
  }

  private createEndpoint(
    middlewares: MiddlewareFn[],
    options: BuildOptions = {}
  ): Endpoint {
    return async (req, ctx) => {
      try {
        middlewares = [...this.commonMiddlewares, ...middlewares];
        const lastResponse = await this.getLastResponse(middlewares, req, ctx);
        return lastResponse;
      } catch (error) {
        if (!options.onError) throw error;

        return await options.onError(error, req, ctx);
      }
    };
  }

  private async getLastResponse(
    middlewares: MiddlewareFn[],
    req: NextRequest,
    ctx?: Context
  ): Promise<NextResponse> {
    let lastResponse: NextResponse;
    for (const fn of middlewares) {
      const response = await fn(req, ctx, lastResponse);
      lastResponse = response || undefined;
    }
    if (!lastResponse) {
      throw new NotImplementedError({
        message: "É necessário que o último middleware tenha um retorno.",
        action: `Confira os middlewares usados no endpoint [${req.method}] ${req.url}`,
      });
    }
    return lastResponse;
  }
}

type TypeOrPromise<T> = T | Promise<T>;

type AllowedMethods = "POST" | "DELETE";

type EndpointMiddlewares = {
  [key in AllowedMethods]?: MiddlewareFn[];
};

type EndpointMethods = {
  [key in AllowedMethods]?: Endpoint;
};

type BuildOptions = {
  onError?(
    error: unknown,
    req: NextRequest,
    ctx: Context
  ): Promise<NextResponse> | NextResponse;
};

export type Context<T extends object = never> = { params: Awaited<T> };

export type MiddlewareFn<T extends object = never> = (
  req: NextRequest,
  ctx?: Context<T>,
  responseResult?: NextResponse
) => TypeOrPromise<NextResponse> | TypeOrPromise<void>;

export type Endpoint<T extends object = never> = (
  req: NextRequest,
  ctx?: Context<T>
) => Promise<NextResponse>;
