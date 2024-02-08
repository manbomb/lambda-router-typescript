import { APIGatewayProxyEventV2 } from "aws-lambda";
import supertest from "supertest";

import ExampleRepository from "../src/example/ExampleRepository";

import Router, {
    ExpressLambdaServer,
    JSONBody,
    LambdaFunctionUrlEvent,
    LambdaFunctionUrlResult,
    Middleware,
    RateLimiter,
} from "../src";

describe("Router", () => {
    const port = 3000;

    const consoleMiddleware: Middleware = (event) => {
        return [null, null];
    };

    async function handler(
        event: LambdaFunctionUrlEvent
    ): Promise<LambdaFunctionUrlResult> {
        const router = new Router();

        router.use(consoleMiddleware);
        router.use(new JSONBody().middleware);
        router.use(new RateLimiter(new ExampleRepository(), {}).middleware);

        const controller = async (event: APIGatewayProxyEventV2) => {
            const response: LambdaFunctionUrlResult = {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Health!",
                    event,
                }),
            };
            return response;
        };

        router
            .post("/teste", controller)
            .put("/teste", controller)
            .get("/teste", controller)
            .delete("/teste", controller);

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

    const server = ExpressLambdaServer.start(port, handler, (port) =>
        console.log(`Listening on port: ${port}`)
    );

    it("should respond with health message on post /teste", async () => {
        const response = await supertest(server).post("/teste").send({});
        const responseBody = JSON.parse(response.text);

        expect(response.statusCode).toBe(200);
        expect(responseBody.message).toBe("Health!");
    });

    it("should respond with health message on get /teste", async () => {
        const response = await supertest(server).get("/teste").send({});
        const responseBody = JSON.parse(response.text);

        expect(response.statusCode).toBe(200);
        expect(responseBody.message).toBe("Health!");
    });

    it("should respond with health message on put /teste", async () => {
        const response = await supertest(server).put("/teste").send({});
        const responseBody = JSON.parse(response.text);

        expect(response.statusCode).toBe(200);
        expect(responseBody.message).toBe("Health!");
    });

    it("should respond with health message on delete /teste", async () => {
        const response = await supertest(server).delete("/teste").send({});
        const responseBody = JSON.parse(response.text);

        expect(response.statusCode).toBe(200);
        expect(responseBody.message).toBe("Health!");
    });

    it("should throw JSON body", async () => {
        const response = await supertest(server).delete("/teste").send();
        const responseBody = JSON.parse(response.text);

        expect(response.statusCode).toBe(200);
        expect(responseBody.message).toBe("Health!");
    });
});
