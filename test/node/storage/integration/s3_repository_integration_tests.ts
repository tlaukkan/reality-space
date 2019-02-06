import {expect} from 'chai';
import {S3Repository} from "../../../../src/node/storage/S3Repository";

describe('S3 Repository Test.', () => {

    it('Should test S3 repository', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();
        await repository.save("data/test1/test.txt", "test");
        const loaded = await repository.load("data/test1/test.txt");
        expect(loaded).eq("test");
        await repository.delete("data/test1/test.txt");
        expect(await repository.load("data/test1/test.txt")).eq("");
    });

    it('Should test file system repository file save and load', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();
        await repository.saveFile("data/test1/test2.txt", Buffer.alloc(5, "test2", "utf-8"));
        const loaded = await repository.loadFile("data/test1/test2.txt");
        expect(loaded!!.mimeType).eq("text/plain");
        expect(loaded!!.buffer.toString()).eq("test2");
        await repository.delete("data/test1/test2.txt");
        expect(await repository.loadFile("data/test1/test2.txt")).eq(undefined);
    });

});