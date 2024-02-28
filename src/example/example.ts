import Router, {
    AddContentTypeJSON,
    ExpressLambdaServer,
    JSONBody,
    LambdaFunctionUrlEvent,
    LambdaFunctionUrlResult,
    Middleware,
    RateLimiter,
} from "../../lib";

import ExampleRepository from "./ExampleRepository";

const repository = new ExampleRepository();
const rateLimiter = new RateLimiter(repository, {
    rpm: 20,
    rps: null,
});
const jsonBody = new JSONBody();

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
    const randomBool = Math.random() > 0.05;
    if (randomBool) return [null, null];
    const res: LambdaFunctionUrlResult = {
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
    router.use(rateLimiter.middleware);
    router.use(jsonBody.middleware);

    router.useParser(AddContentTypeJSON);

    router.post("/teste", async (event) => {
        const response: LambdaFunctionUrlResult = {
            statusCode: 200,
            body: JSON.stringify({
                message: "Health!",
            }),
        };
        return response;
    });

    const response = await router.call(event);
    return response;
}

ExpressLambdaServer.start(3000, handler, (port) =>
    console.log(`Listening on port: ${port}`)
);
