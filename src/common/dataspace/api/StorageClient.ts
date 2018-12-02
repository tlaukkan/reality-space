import {User} from "./User";
import uuid = require("uuid");

export class StorageClient {

    url: string;
    idToken: string;

    constructor(url: string, idToken: string) {
        this.url = url;
        this.idToken = idToken;
    }

    async getUsers(): Promise<Array<User>> {
        return this.parse(await this.request("GET", "/users", [200]));
    };

    async getUser(id: string): Promise<User | undefined> {
        return this.parseOptional(await this.request("GET", "/users/" + id, [200, 404]));
    }

    async addUser(user: User): Promise<User> {
        return this.parse(await this.requestWithBody("POST", "/users", user, [200]));
    }

    async updateUser(user: User): Promise<User> {
        return this.parse(await this.requestWithBody("PUT", "/users/" + user.id, user, [200]));
    }

    async removeUser(id: string): Promise<void> {
        await this.request("DELETE", "/users/" + id, [200]);
    }






    private async request(method: string, path: string, successStatuses: Array<number>) {
        const response = (await fetch(this.url + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()}
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async requestWithBody(method: string, path: string, body: any, successStatuses: Array<number>) {
        const response = (await fetch(this.url + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()},
            body: JSON.stringify(body)
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async parse(response: Response): Promise<any> {
        return await response.json();
    }

    private async parseOptional(response: Response): Promise<any | undefined> {
        if (response.status == 404) {
            return undefined;
        } else {
            return await response.json();
        }
    }

}