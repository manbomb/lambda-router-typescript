import { LambdaFunctionUrlResult } from "..";
import Parser from "./Parser";

const AddContentTypeJSON: Parser = (
    res: LambdaFunctionUrlResult
): LambdaFunctionUrlResult => {
    return {
        ...res,
        headers: {
            ...res.headers,
            "Content-Type": "application/json",
        },
    };
};

export default AddContentTypeJSON;
