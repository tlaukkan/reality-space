export class Principal {
    issuer: string;
    tokenId: string;
    requestId: string;
    userId: string;
    userName: string;

    constructor(issuer: string, tokenId: string, requestId: string, userId: string, userName: string) {
        this.issuer = issuer;
        this.tokenId = tokenId;
        this.requestId = requestId;
        this.userId = userId;
        this.userName = userName;
    }
}