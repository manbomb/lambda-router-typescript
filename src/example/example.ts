import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import Router, { ExpressLambdaServer } from "../index";

type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2;
type LambdaFunctionUrlEvent = APIGatewayProxyEventV2;

async function handler(
    event: LambdaFunctionUrlEvent
): Promise<LambdaFunctionUrlResult> {
    const router = new Router();

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

ExpressLambdaServer.start(3000, handler, (port) => console.log(`Listening on port: ${port}`));