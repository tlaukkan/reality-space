export class Principal {
    issuer: string;
    tokenId: string;
    requestId: string;
    userId: string;
    userName: string;
    groups: Array<string> | undefined;

    constructor(issuer: string, tokenId: string, requestId: string, userId: string, userName: string, groups: Array<string> | undefined) {
        this.issuer = issuer;
        this.tokenId = tokenId;
        this.requestId = requestId;
        this.userId = userId;
        this.userName = userName;
        this.groups = groups;
    }
}