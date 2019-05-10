//import {Readable} from "stream";

export const PUBLIC_TEST_CLUSTER_CONFIG_URL = "https://cdn.jsdelivr.net/gh/tlaukkan/reality-space@0.0.36/config/public-test-cluster.json";

export const PUBLIC_TEST_CLUSTER_PROCESSOR_URL = "wss://rs-test-processor.herokuapp.com/";
export const PUBLIC_TEST_CLUSTER_STORAGE_URL = "https://rs-test-storage.herokuapp.com/api/";
export const PUBLIC_TEST_CLUSTER_CDN_URL = "https://rs-test-storage.herokuapp.com/api/";

export const PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL = "wss://rs-test-processor-0-0-0.herokuapp.com/";

export const PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME = "0-0-0";
export const PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_200_NAME = "0-0-200";

export const DEFAULT_DIMENSION = "default";

/*
export async function streamToString(readableStream: ReadableStream) {
    let loadedText = '';
    const decoder = new TextDecoder("utf-8");
    for await (const chunk of readableStream as any) {
        loadedText += decoder.decode(chunk);
    }
    return loadedText;
}

export function stringToStream(testText: string) {
    const encoder = new TextEncoder();
    const stream = new Readable() as any;
    stream.push(encoder.encode(testText));
    stream.push(null);
    return stream;
}*/
