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
        const response = (await fetch(this.url + "/users", { headers: { "Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4() }}));
        if (response.status != 200) {
            throw new Error(response.status.toString());
        }
        return await response.json();
    };

    async getUser(id: string): Promise<User | undefined> {
        const response = await fetch(this.url + "/users/" + id, { headers: { "Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4() }});

        if (response.status == 404) {
            return undefined;
        }

        if (response.status != 200) {
            throw new Error(response.status.toString());
        }

        return await response.json();
    }

}