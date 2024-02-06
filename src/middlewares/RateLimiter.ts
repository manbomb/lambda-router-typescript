import { LambdaFunctionUrlResult } from "..";
import Repository from "../Repository";
import { HttpStatusCode, Nullable } from "../Types";
import Middleware from "./Middleware";

export default class RateLimiter {
    constructor(
        private readonly repository: Repository,
        private readonly config: RateLimiterConfig
    ) {}

    middleware: Middleware = async (event) => {
        const id = event.requestContext.http.sourceIp;

        const now = new Date().getTime();
        const lastTime = await this.repository.get(id);

        const msDelta = now - lastTime;
        const sDelta = msDelta / 1000;
        const rps = sDelta === 0 ? 0 : 1 / sDelta;
        const mDelta = sDelta / 60;
        const rpm = mDelta === 0 ? 0 : 1 / mDelta;

        if (this.config.console)
            console.log(
                `sourceIp: ${id}\n\tmsDelta: ${msDelta}\tsDelta: ${sDelta}\tmDelta: ${mDelta}\n\trps: ${rps}\trpm: ${rpm}\n`
            );

        const error: LambdaFunctionUrlResult = {
            statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
        };

        if (this.config.rpm && rpm >= this.config.rpm) {
            return [null, error];
        }

        if (this.config.rps && rps >= this.config.rps) {
            return [null, error];
        }

        return [null, null];
    };
}

export interface RateLimiterConfig {
    rpm?: Nullable<number>;
    rps?: Nullable<number>;
    console?: Boolean;
}
