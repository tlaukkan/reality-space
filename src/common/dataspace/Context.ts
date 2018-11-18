export class Context {
    userId: string;
    userName: string;

    constructor(userId: string, userName: string) {
        this.userId = userId;
        this.userName = userName;
    }
}