import type { APIGatewayProxyEventV2 } from 'aws-lambda';

type LambdaFunctionUrlEvent = APIGatewayProxyEventV2;

export default class Router {
    private routes: Route[] = [];
    private authorizationMiddleware: ((event: LambdaFunctionUrlEvent) => Promise<boolean> | boolean) | undefined;

    constructor(authorizationMiddleware?: ((event: LambdaFunctionUrlEvent) => Promise<boolean> | boolean)) {
        this.authorizationMiddleware = authorizationMiddleware;
    }

    get(path: string, callback: (event: RouterEvent) => Promise<any>, options?: RouteOptions) {
        this.addRoute('GET', path, callback, options);
        return this;
    }

    post(path: string, callback: (event: RouterEvent) => Promise<any>, options?: RouteOptions) {
        this.addRoute('POST', path, callback, options);
        return this;
    }

    put(path: string, callback: (event: RouterEvent) => Promise<any>, options?: RouteOptions) {
        this.addRoute('PUT', path, callback, options);
        return this;
    }

    delete(path: string, callback: (event: RouterEvent) => Promise<any>, options?: RouteOptions) {
        this.addRoute('DELETE', path, callback, options);
        return this;
    }

    private addRoute(httpMethod: string, path: string, callback: (event: RouterEvent) => Promise<any>, options?: RouteOptions) {
        this.routes.push({
            httpMethod,
            path,
            callback,
            auth: options?.auth || false
        });
    }

    async call(event: RouterEvent | LambdaFunctionUrlEvent) {
        const httpContext = event.requestContext.http;
        const httpMethod = httpContext.method;
        const stage = (event as LambdaFunctionUrlEvent).requestContext.stage;
        let path = httpContext.path.replace(/(^.+)\/$/, '$1');

        if (stage != '$default') {
            path = path.replace(stage, '');
        }

        const filtredRoutes = this.routes.filter(r => {
            return r.httpMethod === httpMethod && r.path === path;
        });

        if (filtredRoutes.length < 1) {
            throw {
                statusCode: 404,
                body: {
                    message: `Not found: ${httpMethod} ${path}`
                }
            };
        }

        const selectedRoute = filtredRoutes[0];

        if (this.authorizationMiddleware && selectedRoute.auth) {
            const authorized = await this.authorizationMiddleware(event as LambdaFunctionUrlEvent);
            if (!authorized) {
                throw {
                    statusCode: 403,
                    body: {
                        message: `Not authorized`
                    }
                };
            }
        }

        const response = await filtredRoutes[0].callback(event);

        return response;
    }
}

export interface RouterEvent {
    requestContext: {
        http: {
            method: string,
            path: string
        }
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