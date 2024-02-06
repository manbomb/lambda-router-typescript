import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import Middleware from "./Middleware";

type LambdaFunctionUrlEvent = APIGatewayProxyEventV2;
type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2;

export default class Router {
    private routes: Route[] = [];
    private middlewares: Middleware[] = [];

    constructor() {}

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    get(
        path: string,
        callback: (event: LambdaFunctionUrlEvent) => Promise<any>,
        options?: RouteOptions
    ) {
        this.addRoute("GET", path, callback, options);
        return this;
    }

    post(
        path: string,
        callback: (event: LambdaFunctionUrlEvent) => Promise<any>,
        options?: RouteOptions
    ) {
        this.addRoute("POST", path, callback, options);
        return this;
    }

    put(
        path: string,
        callback: (event: LambdaFunctionUrlEvent) => Promise<any>,
        options?: RouteOptions
    ) {
        this.addRoute("PUT", path, callback, options);
        return this;
    }

    delete(
        path: string,
        callback: (event: LambdaFunctionUrlEvent) => Promise<any>,
        options?: RouteOptions
    ) {
        this.addRoute("DELETE", path, callback, options);
        return this;
    }

    private addRoute(
        httpMethod: string,
        path: string,
        callback: (event: LambdaFunctionUrlEvent) => Promise<any>,
        options?: RouteOptions
    ) {
        this.routes.push({
            httpMethod,
            path,
            callback,
            auth: options?.auth || false,
        });
    }

    async call(event: LambdaFunctionUrlEvent) {
        const httpContext = event.requestContext.http;
        const httpMethod = httpContext.method;
        const stage = (event as LambdaFunctionUrlEvent).requestContext.stage;
        let path = httpContext.path.replace(/(^.+)\/$/, "$1");

        if (stage != "$default") {
            path = path.replace(stage, "");
        }

        const filtredRoutes = this.routes.filter((r) => {
            return r.httpMethod === httpMethod && r.path === path;
        });

        if (filtredRoutes.length < 1) {
            throw {
                statusCode: 404,
                body: {
                    message: `Not found: ${httpMethod} ${path}`,
                },
            };
        }

        const selectedRoute = filtredRoutes[0];

        let eventAfterMiddlewares: LambdaFunctionUrlEvent = event;

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
}

export interface Route {
    httpMethod: string;
    path: string;
    callback: Function;
    auth: boolean;
}

export interface RouteOptions {
    auth?: boolean;
}
