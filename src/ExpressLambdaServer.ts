import express, { Express, Request, Response, json } from "express";

import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

type HandlerType = (
    event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyStructuredResultV2>;

export default class ExpressLambdaServer {
    static start(
        port: number,
        handler: HandlerType,
        callback?: ((port: number) => void) | undefined
    ): Express {
        const server = express();

        server.use(json());

        server.all("*", async (req: Request, res: Response) => {
            const event = {
                version: "2.0",
                routeKey: req.path,
                rawPath: req.url,
                rawQueryString: req.url.split("?")[1] || "",
                cookies: req.cookies,
                headers: Object.fromEntries(
                    Object.entries(req.headers)
                        .filter(([key, value]) => !!value)
                        .map(([key, value]) => {
                            const valueAsString = value as string | string[];
                            const isArray = Array.isArray(value);
                            if (isArray) {
                                return [
                                    key,
                                    (valueAsString as string[]).join(""),
                                ];
                            } else {
                                return [key, valueAsString as string];
                            }
                        })
                ),
                queryStringParameters: req.query as { [key: string]: string },
                requestContext: {
                    accountId: "your-account-id",
                    apiId: "your-api-id",
                    domainName: req.hostname,
                    domainPrefix: req.hostname.split(".")[0],
                    http: {
                        method: req.method,
                        path: req.path,
                        protocol: req.protocol,
                        sourceIp: req.ip || "",
                        userAgent: req.get("User-Agent") || "",
                    },
                    requestId: "your-request-id",
                    routeKey: req.path,
                    stage: "your-stage",
                    time: new Date().toISOString(),
                    timeEpoch: Date.now(),
                },
                body: JSON.stringify(req.body),
                isBase64Encoded: false,
                stageVariables: {},
            };

            const handlerResponse = await handler(event);

            res.status(handlerResponse.statusCode || 500)
                .set(handlerResponse.headers)
                .send(handlerResponse.body);
        });

        server.listen(
            port,
            callback
                ? ((port: number) => {
                      return () => callback(port);
                  })(port)
                : undefined
        );

        return server;
    }
}
