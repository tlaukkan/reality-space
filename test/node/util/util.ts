import {RealityClient} from "../../../src";

require('isomorphic-fetch');

import {RealityServer} from "../../../src/node/server/RealityServer";
import {
    ClusterConfiguration,
    IdTokenIssuer,
    ProcessorConfig,
    SanitizerConfig
} from "../../../src/common/reality/Configuration";
import {createIdToken} from "../../../src/common/reality/util/jwt";
import {Principal} from "../../../src/node/http/Principal";
import {StorageClient} from "../../../src/common/reality/api/StorageClient";
import {w3cwebsocket} from "websocket";
import {newRealityServer} from "../../../src/node/server/server";

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

export function newLocalTestServer(): RealityServer {

    const clusterConfiguration = newLocalClusterConfiguration();

    /*const sanitizer = new Sanitizer(clusterConfiguration.sanitizer.allowedElements, clusterConfiguration.sanitizer.allowedAttributes, clusterConfiguration.sanitizer.allowedAttributeValueRegex);
    const repository = new FileSystemRepository();

    const storageConfiguration = getStorageConfiguration(clusterConfiguration, "http://localhost:8889/api/");

    const storageRestService = new StorageRequestManager(repository, sanitizer, storageConfiguration.regions, storageConfiguration.dimensions, storageConfiguration.maxDimensions);
    const processorManager = new ProcessorRequestManager("ws://localhost:8889/", clusterConfiguration, sanitizer);

    const server = new RealityServer('127.0.0.1', 8889, processorManager, storageRestService, clusterConfiguration.idTokenIssuers);*/

    return newRealityServer(clusterConfiguration, "ws://localhost:8889/", "http://localhost:8889/api/", "local", "0.0.0.0", 8889);
}

export function newLocalClusterConfiguration() {
    const sanitizeConfig = new SanitizerConfig();
    sanitizeConfig.allowedElements = "a-entities,a-scene,a-box,a-circle,a-collada-model,a-cone,a-curvedimage,a-cylinder,a-dodecahedron,a-gltf-model,a-icosahedron,a-image,a-obj-model,a-octahedron,a-plane,a-ring,a-sound,a-sphere,a-tetrahedron,a-text,a-torus-knot,a-torus,a-triangle";
    sanitizeConfig.allowedAttributes = "sid,scale,src,geometry,material,position,rotation,sound,text";
    sanitizeConfig.allowedAttributeValueRegex = "[^\\w\\s\\.:;-]";

    const processorConfig = new ProcessorConfig();
    processorConfig.name = "test";
    processorConfig.processorUrl = "ws://localhost:8889/";
    processorConfig.storageUrl = "http://localhost:8889/api/";
    processorConfig.cdnUrl  = "http://localhost:8889/api/";
    processorConfig.dimensions = ["default","dynamic-*"];
    processorConfig.maxDimensions = 2;
    processorConfig.edge = process.env.GRID_EDGE as any || 140;
    processorConfig.step = process.env.GRID_STEP as any || 10;
    processorConfig.range = process.env.GRID_RANGE as any || 20;
    processorConfig.x = process.env.GRID_CX as any || 0;
    processorConfig.y = process.env.GRID_CY as any || 0;
    processorConfig.z = process.env.GRID_CZ as any || 0;

    const clusterConfiguration = new ClusterConfiguration();
    clusterConfiguration.name = "local-cluster";
    clusterConfiguration.description = "local-cluster";
    clusterConfiguration.edge = 1000;
    clusterConfiguration.step = 100;
    clusterConfiguration.range = 200;
    clusterConfiguration.dimensions = ["default","dynamic-*"];
    clusterConfiguration.maxDimensions = 2;
    clusterConfiguration.storageUrl = "http://localhost:8889/api/";
    clusterConfiguration.cdnUrl = "http://localhost:8889/api/";
    clusterConfiguration.sanitizer = sanitizeConfig;
    clusterConfiguration.processors = [processorConfig];
    clusterConfiguration.idTokenIssuers = [
        new IdTokenIssuer(
            "test-issuer",
            "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")
    ];

    return clusterConfiguration;
}

export async function startLocalTestServer(): Promise<RealityServer> {
    const server = newLocalTestServer();

    await server.startup();

    return server;
}

export function newLocalTestStorageClient() {
    return new StorageClient("default", "test", "http://127.0.0.1:8889/api/", "http://localhost:8889/api/", createTestIdToken());
}

export function newLocalTestRealityClient() {
    const client = new RealityClient("default", "test", "ws://127.0.0.1:8889/", "http://localhost:8889/api/", "http://localhost:8889/api/", createTestIdToken());
    client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
    return client;
}

export function newLocalTestRealityClientWithoutAccessRights() {
    const client = new RealityClient("default", "test", "ws://127.0.0.1:8889/", "http://localhost:8889/api/", "http://localhost:8889/api/", createTestIdTokenWithoutGroups());
    client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
    return client;
}

export function newStorageClientDynamicDimension() {
    return new StorageClient("dynamic-1", "test", "http://127.0.0.1:8889/api/", "http://localhost:8889/api/", createTestIdToken());
}

export function resetStorage(server: RealityServer) {
    if (server.storageManager) {
        server.storageManager.storages.forEach(dimensionStorages => {
            dimensionStorages.forEach(storage => {
                storage.clear();
                storage.init();
                const principal = new Principal("", "", "", "1", "test", ["administrators", "modifiers"]);
                storage.addUser(new Principal("", "", "", "1", "test", ["administrators", "modifiers"]), principal.userId, principal.userName);
            });
        });
    }

}

export function createTestIdToken(): string {
    const privateKeyEncoded: string = "LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlGTFRCWEJna3Foa2lHOXcwQkJRMHdTakFwQmdrcWhraUc5dzBCQlF3d0hBUUljV2g2ejlFTVlNMENBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3SFFZSllJWklBV1VEQkFFcUJCQnFPcFhieDcxTkpaQktNUi82OHE3MkJJSUUKMEhWQk4wdWZ3YTNVcllPL0orS0RWdHZZQVY0SGtaM1JCUDlENkRLdXRQSzkyd1Q2Q2lPQjh3Y2ZTajFkRUVnbApGSFpORGg3Zk1oS25tNjhTWnlZdUNWNjlkbVpCTURMZzVQcUV0anZ3UTFKNXBwTUNuRGdMS3JpWUk0bVBmaHJDCmc4T2dmb2d1czlmY1M1L3R5blYrVmREQXRWWG5VNVdWNkduUTcxMUNIUXR0emdOWk1GOGZlbDV5bVhpeDhrRUEKV25TdDJwQVdYckdOQ3RCdzgvOFhmUTFnejRMaHpxY1dHeE1zWjFHb1FRRVRUNExwc1RZN21pc0pVOGhTRVBpagpVeVFMMVlwMGpESXBuSUJOckwwY1F1cWl5TE4yRkRLRi9EQWp4V1RlSnNtYTF5a3E1MjhxWHdKNTQzaDlBc1FKClVWaDlhZW1mUEUyUjI5RU82cy9qcVpUZ29JWDJLUzZKZzhCYWc4UHJya1lRQnp3RUNOamlCRWlKY2NIK2JEekgKVnZLd0N3MmduTVgyam5KNTdZVHJDcXB6MVFkTDFlbm52dEpVTUhqTndhM1BBQThQWU1HanZSNzJkOHRGMm5lUwprUjY0UEtiQlFqS2RjdUdwSzR5UEhzQTN4UTJobkIvVWJpMjZKVzJRQjFGckJNc1Z5bmtzZlAwWUtaV3A0c3NRCmY4azJyaWlkOXB1dk91RHl1OHUwVm42bHZFT2Y5MXY5Q2w4NUdlU2JnM0w2UEovSExTUllyU2ZyT21tL29TQTEKSFhISmJoN2g4QzZYbll4YzZrdEp5bXg0NFdPNnFkSG84ckFUelhzQUpoYlh6L3ZXaEpkNzdEMnRUTitSM00zbgo5TEJlUXpPcWYyQVdlTFZZRnRSdlE1VU9HMzlsbjVaYllWSTgzOFppN0ZjakxRU2FINEpualJsbktlejF1RDhLCnBwdWtVVmFZZi9SeElHdkJwUGQrREIreXpyZzRVQVZ6bXk1OW43TDkxSWxmbnFBaFk1d2ZTRkJ4Q2ZSY1dFeEEKWWJWZTZ2OTMrdWNnRE9qeHdyUXpUa2ltMkJTRkhlMEIraXVVaEpDa2ZWNHZtYk1VR2FpQ3dpNnJxc1NsdnBlMQpCQlhFSG1OMDVDcGhIMEtJVEM0cmhLQXhzYkRpNXd2c1hZUnhpdGp0TmthQUZCejk4dXhJem5tSkplc29VQmx3CmtlbnNxb3czaGlLbVN5ajZRYndneWNSVEV2Qm9oeDYvdkJXNEtwRlpSaVo1T2ZDRDV2QlRneWFBakh4K0RmWXYKNnJDZmlHdHVITEJ0MTlmS01BekZIaXQ0WTFsRk81dHpjTUlCemhIdGN0VE5wN21IVS9sZkVrVGJHYVJYMUt3QQp6MWlQU2lDMUJvMlVQczRudVl4V1l4SmlYRFhaV2wrOWFWS2doSlpacmJKUjFyL0c5MkZUSHBzSXVhMGZnMDNVCjliWUhEWWNOM3Z1S25YcEluUk9MRm1oY0grOWd4OXdZRkxJT0IvS2tkUm93K2NMclk0NllMNVR2QUFYWG5maEIKc3kvc0xRcDhqaFY0TTg0VEpLS1g2YmN3ZUVsSzVDakJpVmE4MDNuSFp0SUd6c2N5UW9meDA1ejFWWHVIK1ZEcwova1hmTW1FenZ1RUdCK2t3MW9vbDJPczB2Q3FsV2hoQzlSTXB4KzRrbGlUbkhrbE1hcWpFc2hXQlloVVV3aG0rCkFqejMzWVUxTndtZXpDaENEYkxuQnkxeEFZR1c5TWtGUzRiYmZWSnN6cTRYYjdFYlg1K1NBU2N6c2RTcGZvc3UKL0Jxa2Y1K0xzc09vQVFqWER5cUJsb3VhcGptNDJZNk5peDl3ZGQ4NTdOMTB1cysvakd1ckt4bFJ1OVFsWE4rQwp3Q2VSUzZpemlPbXd4SVlGV25nSWZncGxaMDNVdWxENStDak1NQkV1eXZ3WnRnZUZMUkxJTnlmcGFvdGRBR3ExCldsVXRRVG9iaWFkT3dWQ29TV0M4SkkwbEUwSEVMYlIzNHJQZ0Mrck1BeTB2clpkd0FyKzd1aWpzWk5Md2dkQVYKT2luRnppajJ0bHlqN0E3cG1QK0tQTnNmYlZnbzJsMzR2SUp5UjhOR0docFk1Rkt4YnVYZHpBZ0szb0xFTlRIWQo3WGtPbWhqR2djdE4zSXJsVmZpekV5bDJkWVhCNndUVVZOa0lGVzlPeUE3RQotLS0tLUVORCBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQo=";
    const idToken = createIdToken("test-issuer", "1", "test", "administrators,viewers", privateKeyEncoded);
    return idToken;
}

export function createTestIdTokenWithoutGroups(): string {
    const privateKeyEncoded: string = "LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlGTFRCWEJna3Foa2lHOXcwQkJRMHdTakFwQmdrcWhraUc5dzBCQlF3d0hBUUljV2g2ejlFTVlNMENBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3SFFZSllJWklBV1VEQkFFcUJCQnFPcFhieDcxTkpaQktNUi82OHE3MkJJSUUKMEhWQk4wdWZ3YTNVcllPL0orS0RWdHZZQVY0SGtaM1JCUDlENkRLdXRQSzkyd1Q2Q2lPQjh3Y2ZTajFkRUVnbApGSFpORGg3Zk1oS25tNjhTWnlZdUNWNjlkbVpCTURMZzVQcUV0anZ3UTFKNXBwTUNuRGdMS3JpWUk0bVBmaHJDCmc4T2dmb2d1czlmY1M1L3R5blYrVmREQXRWWG5VNVdWNkduUTcxMUNIUXR0emdOWk1GOGZlbDV5bVhpeDhrRUEKV25TdDJwQVdYckdOQ3RCdzgvOFhmUTFnejRMaHpxY1dHeE1zWjFHb1FRRVRUNExwc1RZN21pc0pVOGhTRVBpagpVeVFMMVlwMGpESXBuSUJOckwwY1F1cWl5TE4yRkRLRi9EQWp4V1RlSnNtYTF5a3E1MjhxWHdKNTQzaDlBc1FKClVWaDlhZW1mUEUyUjI5RU82cy9qcVpUZ29JWDJLUzZKZzhCYWc4UHJya1lRQnp3RUNOamlCRWlKY2NIK2JEekgKVnZLd0N3MmduTVgyam5KNTdZVHJDcXB6MVFkTDFlbm52dEpVTUhqTndhM1BBQThQWU1HanZSNzJkOHRGMm5lUwprUjY0UEtiQlFqS2RjdUdwSzR5UEhzQTN4UTJobkIvVWJpMjZKVzJRQjFGckJNc1Z5bmtzZlAwWUtaV3A0c3NRCmY4azJyaWlkOXB1dk91RHl1OHUwVm42bHZFT2Y5MXY5Q2w4NUdlU2JnM0w2UEovSExTUllyU2ZyT21tL29TQTEKSFhISmJoN2g4QzZYbll4YzZrdEp5bXg0NFdPNnFkSG84ckFUelhzQUpoYlh6L3ZXaEpkNzdEMnRUTitSM00zbgo5TEJlUXpPcWYyQVdlTFZZRnRSdlE1VU9HMzlsbjVaYllWSTgzOFppN0ZjakxRU2FINEpualJsbktlejF1RDhLCnBwdWtVVmFZZi9SeElHdkJwUGQrREIreXpyZzRVQVZ6bXk1OW43TDkxSWxmbnFBaFk1d2ZTRkJ4Q2ZSY1dFeEEKWWJWZTZ2OTMrdWNnRE9qeHdyUXpUa2ltMkJTRkhlMEIraXVVaEpDa2ZWNHZtYk1VR2FpQ3dpNnJxc1NsdnBlMQpCQlhFSG1OMDVDcGhIMEtJVEM0cmhLQXhzYkRpNXd2c1hZUnhpdGp0TmthQUZCejk4dXhJem5tSkplc29VQmx3CmtlbnNxb3czaGlLbVN5ajZRYndneWNSVEV2Qm9oeDYvdkJXNEtwRlpSaVo1T2ZDRDV2QlRneWFBakh4K0RmWXYKNnJDZmlHdHVITEJ0MTlmS01BekZIaXQ0WTFsRk81dHpjTUlCemhIdGN0VE5wN21IVS9sZkVrVGJHYVJYMUt3QQp6MWlQU2lDMUJvMlVQczRudVl4V1l4SmlYRFhaV2wrOWFWS2doSlpacmJKUjFyL0c5MkZUSHBzSXVhMGZnMDNVCjliWUhEWWNOM3Z1S25YcEluUk9MRm1oY0grOWd4OXdZRkxJT0IvS2tkUm93K2NMclk0NllMNVR2QUFYWG5maEIKc3kvc0xRcDhqaFY0TTg0VEpLS1g2YmN3ZUVsSzVDakJpVmE4MDNuSFp0SUd6c2N5UW9meDA1ejFWWHVIK1ZEcwova1hmTW1FenZ1RUdCK2t3MW9vbDJPczB2Q3FsV2hoQzlSTXB4KzRrbGlUbkhrbE1hcWpFc2hXQlloVVV3aG0rCkFqejMzWVUxTndtZXpDaENEYkxuQnkxeEFZR1c5TWtGUzRiYmZWSnN6cTRYYjdFYlg1K1NBU2N6c2RTcGZvc3UKL0Jxa2Y1K0xzc09vQVFqWER5cUJsb3VhcGptNDJZNk5peDl3ZGQ4NTdOMTB1cysvakd1ckt4bFJ1OVFsWE4rQwp3Q2VSUzZpemlPbXd4SVlGV25nSWZncGxaMDNVdWxENStDak1NQkV1eXZ3WnRnZUZMUkxJTnlmcGFvdGRBR3ExCldsVXRRVG9iaWFkT3dWQ29TV0M4SkkwbEUwSEVMYlIzNHJQZ0Mrck1BeTB2clpkd0FyKzd1aWpzWk5Md2dkQVYKT2luRnppajJ0bHlqN0E3cG1QK0tQTnNmYlZnbzJsMzR2SUp5UjhOR0docFk1Rkt4YnVYZHpBZ0szb0xFTlRIWQo3WGtPbWhqR2djdE4zSXJsVmZpekV5bDJkWVhCNndUVVZOa0lGVzlPeUE3RQotLS0tLUVORCBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQo=";
    const idToken = createIdToken("test-issuer", "3", "test-3", "", privateKeyEncoded);
    return idToken;
}