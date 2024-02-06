import Repository from "../Repository";

export default class ExampleRepository implements Repository {
    data: { [key: string]: number | undefined };
    constructor() {
        this.data = {};
    }

    get(id: string): number {
        const now = (new Date()).getTime();
        const lastTime = this.data[id];
        this.data[id] = now;
        if (lastTime) return lastTime;
        return now;
    }
}
