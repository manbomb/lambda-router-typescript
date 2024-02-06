import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import Router, { ExpressLambdaServer } from "../index";
import Middleware from "../Middleware";

type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2;
type LambdaFunctionUrlEvent = APIGatewayProxyEventV2;

const consoleMiddleware: Middleware = (event) => {
    console.log(event);
    return [null, null];
};

const addKeyValueToBodyMiddleware: Middleware = (event) => {
    const newEvent = { ...event };
    if (newEvent.body) {
        const bodyObj = JSON.parse(newEvent.body);
        bodyObj["test"] = "new value";
        newEvent.body = JSON.stringify(bodyObj);
    }
    return [newEvent, null];
};

const returnErrorMiddleware: Middleware = (event) => {
    const randomBool = Math.random() > 0.5;
    if (randomBool) return [null, null];
    const res: APIGatewayProxyStructuredResultV2 = {
        body: JSON.stringify({
            message: "An error!",
        }),
        statusCode: 500,
    };
    return [null, res];
};

async function handler(
    event: LambdaFunctionUrlEvent
): Promise<LambdaFunctionUrlResult> {
    const router = new Router();

    router.use(consoleMiddleware);
    router.use(addKeyValueToBodyMiddleware);
    router.use(returnErrorMiddleware);

    router.post("/teste", async (event) => {
        const response: LambdaFunctionUrlResult = {
            statusCode: 200,
            body: JSON.stringify({
                message: "Health!",
                event,
            }),
        };
        return response;
    });

    try {
        const response = await router.call(event);
        return response;
    } catch (error: any) {
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify(error.body) || "Internal error.",
        };
    }
}

ExpressLambdaServer.start(3000, handler, (port) =>
    console.log(`Listening on port: ${port}`)
);
