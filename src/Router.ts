import { LambdaFunctionUrlEvent, LambdaFunctionUrlResult, Parser } from ".";
import { Promiseble } from "./Types";
import Middleware from "./middlewares/Middleware";
import HttpError from "./utils/HttpError";

export default class Router {
    private routes: Route[] = [];
    private middlewares: Middleware[] = [];
    private parsers: Parser[] = [];

    constructor() {}

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    useMiddleware(middleware: Middleware) {
        return this.use(middleware);
    } // alias

    useParser(parser: Parser) {
        this.parsers.push(parser);
    }

    get(path: string, callback: RouteCallback, options?: RouteOptions) {
        this.addRoute("GET", path, callback, options);
        return this;
    }

    post(path: string, callback: RouteCallback, options?: RouteOptions) {
        this.addRoute("POST", path, callback, options);
        return this;
    }

    put(path: string, callback: RouteCallback, options?: RouteOptions) {
        this.addRoute("PUT", path, callback, options);
        return this;
    }

    delete(path: string, callback: RouteCallback, options?: RouteOptions) {
        this.addRoute("DELETE", path, callback, options);
        return this;
    }

    private addRoute(
        httpMethod: string,
        path: string,
        callback: RouteCallback,
        options?: RouteOptions
    ) {
        this.routes.push({
            httpMethod,
            path,
            callback,
            auth: options?.auth || false,
        });
    }

    private parseResponse: Parser = (response) => {
        const responseParsed = this.parsers.reduce(
            (finalRes, parser) => parser(finalRes),
            response
        );
        return responseParsed;
    };

    private async _call(
        event: LambdaFunctionUrlEvent
    ): Promise<LambdaFunctionUrlResult> {
        const httpContext = event.requestContext.http;
        const httpMethod = httpContext.method;
        const stage = (event as LambdaFunctionUrlEvent).requestContext.stage;
        let path = httpContext.path.replace(/(^.+)\/$/, "$1");

        if (stage != "$default") {
            path = path.replace(stage, "");
        }

        const matchRoute = (routePath: string, requestPath: string) => {
            const routeParts = routePath
                .split("/")
                .filter((part) => part.length > 0);
            const requestParts = requestPath
                .split("/")
                .filter((part) => part.length > 0);

            if (routeParts.length !== requestParts.length) {
                return null;
            }

            const params: { [key: string]: string } = {};

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(":")) {
                    params[routeParts[i].slice(1)] = requestParts[i];
                } else if (routeParts[i] !== requestParts[i]) {
                    return null;
                }
            }

            return params;
        };

        
        const filtredRoutes = this.routes.filter((r) => {
            return (
                r.httpMethod === httpMethod && matchRoute(r.path, path) !== null
            );
        });

        if (filtredRoutes.length < 1) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: `Not found: ${httpMethod} ${path}`,
                }),
            };
        }

        const selectedRoute = filtredRoutes[0];
        const params = matchRoute(selectedRoute.path, path);

        let eventAfterMiddlewares: LambdaFunctionUrlEvent = {
            ...event,
            pathParameters: params || undefined,
        };

        for (let i = 0; i < this.middlewares.length; i++) {
            const middleware = this.middlewares[i];
            const [event, response] = await middleware(eventAfterMiddlewares);
            if (response) {
                return response;
            }
            if (event) {
                eventAfterMiddlewares = event;
            }
        }

        const response = await selectedRoute.callback(eventAfterMiddlewares);

        return response;
    }

    private async _secureCall(
        event: LambdaFunctionUrlEvent
    ): Promise<LambdaFunctionUrlResult> {
        try {
            const response = await this._call(event);
            return response;
        } catch (error: any) {
            console.error(error);
            if (error instanceof HttpError) {
                return error.toLambdaResult();
            }
            return new HttpError().toLambdaResult();
        }
    }

    async call(
        event: LambdaFunctionUrlEvent
    ): Promise<LambdaFunctionUrlResult> {
        return this.parseResponse(await this._secureCall(event));
    }
}

export interface Route {
    httpMethod: string;
    path: string;
    callback: RouteCallback;
    auth: boolean;
}

export type RouteCallback = (
    event: LambdaFunctionUrlEvent
) => Promiseble<LambdaFunctionUrlResult>;

export interface RouteOptions {
    auth?: boolean;
}
