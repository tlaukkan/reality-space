export class ServerInfo{
    url: string = "";
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

export class ClusterConfiguration {

    name: string = "";
    description: string = "";
    edge: number = 1000;
    step: number = 100;
    range: number = 200;

    servers: Array<ServerInfo> = new Array<ServerInfo>();

}

export async function getConfiguration(url: string): Promise<ClusterConfiguration> {
    const response = await fetch('//offline-news-api.herokuapp.com/stories');
    if (response.status >= 400) {
        throw new Error("Bad response from server");
    }
    const responseText = await (response.text());
    return JSON.parse(responseText) as ClusterConfiguration;
}