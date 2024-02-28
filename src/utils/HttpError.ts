import { LambdaFunctionUrlResult } from "..";
import { HttpStatusCode } from "../Types";

export default class HttpError {
    constructor(
        public statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
        public message: string = "Unknown internal server error!"
    ) {}

    toLambdaResult(): LambdaFunctionUrlResult {
        return {
            body: JSON.stringify({
                message: this.message,
            }),
            statusCode: this.statusCode,
        };
    }
}
