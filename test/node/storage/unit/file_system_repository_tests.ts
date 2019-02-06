import {expect} from 'chai';
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";

describe('File System Repository Test.', () => {

    it('Should test file system repository string save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();
        await repository.save("0_0_0/test.txt", "test");
        const loaded = await repository.load("0_0_0/test.txt");
        expect(loaded).eq("test");
        await repository.delete("0_0_0/test.txt");
        expect(await repository.load("0_0_0/test.txt")).eq("");
    });

    it('Should test file system repository file save and load', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();
        await repository.saveFile("0_0_0/test2.txt", Buffer.alloc(5, "test2", "utf-8"));
        const loaded = await repository.loadFile("0_0_0/test2.txt");
        expect(loaded!!.mimeType).eq("text/plain");
        expect(loaded!!.buffer.toString()).eq("test2");
        await repository.delete("0_0_0/test2.txt");
        expect(await repository.loadFile("0_0_0/test2.txt")).eq(undefined);
    });
});