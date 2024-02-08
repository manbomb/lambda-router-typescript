/* istanbul ignore file */
import { Promiseble } from "./Types";

export default interface Repository {
    get(id: string): Promiseble<number>
}