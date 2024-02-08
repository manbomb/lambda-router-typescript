/* istanbul ignore file */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Nullable, Promiseble } from "../Types";

type Middleware = (event: APIGatewayProxyEventV2) => Promiseble<[Nullable<APIGatewayProxyEventV2>, Nullable<APIGatewayProxyStructuredResultV2>]>

export default Middleware