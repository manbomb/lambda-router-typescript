/* istanbul ignore file */
import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import ExpressLambdaServer from "./ExpressLambdaServer";
import Router, { Route, RouteOptions } from "./Router";
import JSONBody from "./middlewares/JSONBody";
import Middleware from "./middlewares/Middleware";
import RateLimiter from "./middlewares/RateLimiter";

import AddContentTypeJSON from "./parsers/AddContentTypeJSON";
import Parser from "./parsers/Parser";

import Repository from "./Repository";

import * as Types from "./Types";

export default Router;

export type LambdaFunctionUrlEvent = APIGatewayProxyEventV2;
export type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2;

export {
    AddContentTypeJSON,
    ExpressLambdaServer,
    JSONBody,
    Middleware,
    Parser,
    RateLimiter,
    Repository,
    Route,
    RouteOptions,
    Types
};

