import {expect} from 'chai';
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";
import {Readable} from "stream";
import {streamToString, stringToStream} from "../../util/util";

describe('File System Repository Test.', () => {

    it('Should test file system repository string save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();
        await repository.save("tests/test.txt", "test");
        const loaded = await repository.load("tests/test.txt");
        expect(loaded).eq("test");
        await repository.delete("tests/test-asset.txt");
        await repository.delete("tests/test-json.json");
        await repository.delete("tests/test-glb.glb");
        expect(await repository.load("tests/test.txt")).eq("");
    });

    it('Should test file system repository text file save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();

        const testAssetName = "tests/test-asset.txt";
        const testText = "test-data";


        await repository.saveFile(testAssetName, stringToStream(testText));

        const loaded = await repository.loadFile(testAssetName);
        expect(loaded).exist;
        expect(loaded!!.mimeType).eq("text/plain");


        let loadedText = await streamToString(loaded!!.readableStream);
        expect(loadedText).eq(testText);

        const directories = await repository.listFiles("tests/");
        expect(directories).exist;
        expect(directories!!.length).eq(1);
        expect(directories!![0]).eq("test-asset.txt");

        await repository.delete(testAssetName);
        expect(await repository.loadFile(testAssetName)).eq(undefined);

        expect((await repository.listFiles("tests/"))!!.length).eq(0);

        expect((await repository.listFiles("non/existing/directory/"))!!.length).eq(0);
    });

    it('Should test file system repository JSON file save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();

        const testAssetName = "tests/test-json.json";
        const testText = "test-data";


        await repository.saveFile(testAssetName, stringToStream(testText));

        const loaded = await repository.loadFile(testAssetName);
        expect(loaded).exist;
        expect(loaded!!.mimeType).eq("application/json");


        let loadedText = await streamToString(loaded!!.readableStream);
        expect(loadedText).eq(testText);

        const directories = await repository.listFiles("tests/");
        expect(directories).exist;
        expect(directories!!.length).eq(1);
        expect(directories!![0]).eq("test-json.json");

        await repository.delete(testAssetName);
        expect(await repository.loadFile(testAssetName)).eq(undefined);

        expect((await repository.listFiles("tests/"))!!.length).eq(0);

        expect((await repository.listFiles("non/existing/directory/"))!!.length).eq(0);
    });

    it('Should test file system repository GLB file save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();

        const testAssetName = "tests/test-glb.glb";
        const testText = "test-data";


        await repository.saveFile(testAssetName, stringToStream(testText));

        const loaded = await repository.loadFile(testAssetName);
        expect(loaded).exist;
        expect(loaded!!.mimeType).eq("model/gltf-binary");


        let loadedText = await streamToString(loaded!!.readableStream);
        expect(loadedText).eq(testText);

        const directories = await repository.listFiles("tests/");
        expect(directories).exist;
        expect(directories!!.length).eq(1);
        expect(directories!![0]).eq("test-glb.glb");

        await repository.delete(testAssetName);
        expect(await repository.loadFile(testAssetName)).eq(undefined);

        expect((await repository.listFiles("tests/"))!!.length).eq(0);

        expect((await repository.listFiles("non/existing/directory/"))!!.length).eq(0);
    });
});