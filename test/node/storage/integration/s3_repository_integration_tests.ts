import {expect} from 'chai';
import {S3Repository} from "../../../../src/node/storage/S3Repository";

describe('S3 Repository Test.', () => {

    it('Should test S3 repository', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();
        await repository.save("tests/test.txt", "test");
        const loaded = await repository.load("tests/test.txt");
        expect(loaded).eq("test");
        await repository.delete("tests/test.txt");
        expect(await repository.load("tests/test.txt")).eq("");
    });

    it('Should test file system repository file save and load', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();
        await repository.saveFile("tests/test2.txt", Buffer.alloc(5, "test2", "utf-8"));
        const loaded = await repository.loadFile("tests/test2.txt");
        expect(loaded!!.mimeType).eq("text/plain");
        expect(loaded!!.buffer.toString()).eq("test2");

        const directories = await repository.listFiles("tests/");
        expect(directories).exist;
        expect(directories!!.length).eq(1);
        expect(directories!![0]).eq("test2.txt");

        await repository.delete("tests/test2.txt");
        expect(await repository.loadFile("tests/test2.txt")).eq(undefined);

        expect((await repository.listFiles("tests/"))!!.length).eq(0);

        expect((await repository.listFiles("non/existing/directory/"))!!.length).eq(0);
    });

});