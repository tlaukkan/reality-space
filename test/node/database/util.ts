import {Server} from "../../../src/common/dataspace/Server";
import {Sanitizer} from "../../../src/common/dataspace/Sanitizer";
import {Processor} from "../../../src/common/dataspace/Processor";
import {Grid} from "../../../src/common/dataspace/Grid";
import {FileSystemRepository} from "../../../src/node/storage/repository/FileSystemRepository";
import {StorageRestService} from "../../../src/node/storage/StorageRestService";
import {IdTokenIssuer} from "../../../src/common/dataspace/Configuration";
import {createIdToken} from "../../../src/node/util/jwt";

export const waitOnCondition = (condition: (() => boolean)): Promise<void> =>  {
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (condition()) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
    });
};

export async function startTestServer(server: Server) {
    const sanitizer = new Sanitizer("a-scene-fragment,a-scene,a-box,a-circle,a-collada-model,a-cone,a-curvedimage,a-cylinder,a-dodecahedron,a-gltf-model,a-icosahedron,a-image,a-obj-model,a-octahedron,a-plane,a-ring,a-sound,a-sphere,a-tetrahedron,a-text,a-torus-knot,a-torus,a-triangle",
        "sid,scale,src,geometry,material,position,rotation,sound,text",
        "[^\\w\\s\\.:;]");
    const processor = new Processor(new Grid(0, 0, 0, 1000, 100, 200), sanitizer);
    const repository = new FileSystemRepository();
    const storageRestService = new StorageRestService(repository, sanitizer);
    await storageRestService.startup();
    server = new Server('127.0.0.1', 8889, processor, storageRestService, [new IdTokenIssuer("test-issuer", "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")]);
    server.listen();
    return server;
}

export function createTestIdToken() {
    const privateKeyEncoded: string = "LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlGTFRCWEJna3Foa2lHOXcwQkJRMHdTakFwQmdrcWhraUc5dzBCQlF3d0hBUUljV2g2ejlFTVlNMENBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3SFFZSllJWklBV1VEQkFFcUJCQnFPcFhieDcxTkpaQktNUi82OHE3MkJJSUUKMEhWQk4wdWZ3YTNVcllPL0orS0RWdHZZQVY0SGtaM1JCUDlENkRLdXRQSzkyd1Q2Q2lPQjh3Y2ZTajFkRUVnbApGSFpORGg3Zk1oS25tNjhTWnlZdUNWNjlkbVpCTURMZzVQcUV0anZ3UTFKNXBwTUNuRGdMS3JpWUk0bVBmaHJDCmc4T2dmb2d1czlmY1M1L3R5blYrVmREQXRWWG5VNVdWNkduUTcxMUNIUXR0emdOWk1GOGZlbDV5bVhpeDhrRUEKV25TdDJwQVdYckdOQ3RCdzgvOFhmUTFnejRMaHpxY1dHeE1zWjFHb1FRRVRUNExwc1RZN21pc0pVOGhTRVBpagpVeVFMMVlwMGpESXBuSUJOckwwY1F1cWl5TE4yRkRLRi9EQWp4V1RlSnNtYTF5a3E1MjhxWHdKNTQzaDlBc1FKClVWaDlhZW1mUEUyUjI5RU82cy9qcVpUZ29JWDJLUzZKZzhCYWc4UHJya1lRQnp3RUNOamlCRWlKY2NIK2JEekgKVnZLd0N3MmduTVgyam5KNTdZVHJDcXB6MVFkTDFlbm52dEpVTUhqTndhM1BBQThQWU1HanZSNzJkOHRGMm5lUwprUjY0UEtiQlFqS2RjdUdwSzR5UEhzQTN4UTJobkIvVWJpMjZKVzJRQjFGckJNc1Z5bmtzZlAwWUtaV3A0c3NRCmY4azJyaWlkOXB1dk91RHl1OHUwVm42bHZFT2Y5MXY5Q2w4NUdlU2JnM0w2UEovSExTUllyU2ZyT21tL29TQTEKSFhISmJoN2g4QzZYbll4YzZrdEp5bXg0NFdPNnFkSG84ckFUelhzQUpoYlh6L3ZXaEpkNzdEMnRUTitSM00zbgo5TEJlUXpPcWYyQVdlTFZZRnRSdlE1VU9HMzlsbjVaYllWSTgzOFppN0ZjakxRU2FINEpualJsbktlejF1RDhLCnBwdWtVVmFZZi9SeElHdkJwUGQrREIreXpyZzRVQVZ6bXk1OW43TDkxSWxmbnFBaFk1d2ZTRkJ4Q2ZSY1dFeEEKWWJWZTZ2OTMrdWNnRE9qeHdyUXpUa2ltMkJTRkhlMEIraXVVaEpDa2ZWNHZtYk1VR2FpQ3dpNnJxc1NsdnBlMQpCQlhFSG1OMDVDcGhIMEtJVEM0cmhLQXhzYkRpNXd2c1hZUnhpdGp0TmthQUZCejk4dXhJem5tSkplc29VQmx3CmtlbnNxb3czaGlLbVN5ajZRYndneWNSVEV2Qm9oeDYvdkJXNEtwRlpSaVo1T2ZDRDV2QlRneWFBakh4K0RmWXYKNnJDZmlHdHVITEJ0MTlmS01BekZIaXQ0WTFsRk81dHpjTUlCemhIdGN0VE5wN21IVS9sZkVrVGJHYVJYMUt3QQp6MWlQU2lDMUJvMlVQczRudVl4V1l4SmlYRFhaV2wrOWFWS2doSlpacmJKUjFyL0c5MkZUSHBzSXVhMGZnMDNVCjliWUhEWWNOM3Z1S25YcEluUk9MRm1oY0grOWd4OXdZRkxJT0IvS2tkUm93K2NMclk0NllMNVR2QUFYWG5maEIKc3kvc0xRcDhqaFY0TTg0VEpLS1g2YmN3ZUVsSzVDakJpVmE4MDNuSFp0SUd6c2N5UW9meDA1ejFWWHVIK1ZEcwova1hmTW1FenZ1RUdCK2t3MW9vbDJPczB2Q3FsV2hoQzlSTXB4KzRrbGlUbkhrbE1hcWpFc2hXQlloVVV3aG0rCkFqejMzWVUxTndtZXpDaENEYkxuQnkxeEFZR1c5TWtGUzRiYmZWSnN6cTRYYjdFYlg1K1NBU2N6c2RTcGZvc3UKL0Jxa2Y1K0xzc09vQVFqWER5cUJsb3VhcGptNDJZNk5peDl3ZGQ4NTdOMTB1cysvakd1ckt4bFJ1OVFsWE4rQwp3Q2VSUzZpemlPbXd4SVlGV25nSWZncGxaMDNVdWxENStDak1NQkV1eXZ3WnRnZUZMUkxJTnlmcGFvdGRBR3ExCldsVXRRVG9iaWFkT3dWQ29TV0M4SkkwbEUwSEVMYlIzNHJQZ0Mrck1BeTB2clpkd0FyKzd1aWpzWk5Md2dkQVYKT2luRnppajJ0bHlqN0E3cG1QK0tQTnNmYlZnbzJsMzR2SUp5UjhOR0docFk1Rkt4YnVYZHpBZ0szb0xFTlRIWQo3WGtPbWhqR2djdE4zSXJsVmZpekV5bDJkWVhCNndUVVZOa0lGVzlPeUE3RQotLS0tLUVORCBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQo=";
    const idToken = createIdToken("test-issuer", "1", "test@test", "test", privateKeyEncoded);
    return idToken;
}