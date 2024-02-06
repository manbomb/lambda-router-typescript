import { HttpStatusCode, Nullable } from "../Types";
import Middleware from "./Middleware";

export default class JSONBody {
    constructor() {}

    middleware: Middleware = async (event) => {
        const bodyString = event.body;

        if (!bodyString) return [null, null];

        try {
            const body = JSON.parse(bodyString);
            return [{
                ...event,
                body: body
            }, null];
        } catch (e) {
            console.error(e);
            return [
                null,
                {
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                },
            ];
        }
    };
}

export interface RateLimiterConfig {
    rpm?: Nullable<number>;
    rps?: Nullable<number>;
    console?: Boolean;
}
