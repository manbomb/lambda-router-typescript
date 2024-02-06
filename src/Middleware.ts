import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

type Nullable<T> = T | null
type Promiseble<T> = Promise<T> | T

type Middleware = (event: APIGatewayProxyEventV2) => Promiseble<[Nullable<APIGatewayProxyEventV2>, Nullable<APIGatewayProxyStructuredResultV2>]>

export default Middleware