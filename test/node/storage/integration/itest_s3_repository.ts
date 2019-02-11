import {expect} from 'chai';
import {S3Repository} from "../../../../src/node/storage/S3Repository";
import {streamToString, stringToStream} from "../../util/util";

describe('S3 Repository Test.', () => {

    it('Should test S3 repository', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();

        await repository.delete("tests/test.txt");

        await repository.save("tests/test.txt", "test");
        const loaded = await repository.load("tests/test.txt");
        expect(loaded).eq("test");
        await repository.delete("tests/test.txt");
        expect(await repository.load("tests/test.txt")).eq("");
    });

    it('Should test file system repository file save and load', async function () {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();

        await repository.delete("tests2/test2.txt");

        const testText = "test-data";
        const stream = stringToStream(testText);

        await repository.saveFile("tests2/test2.txt", stream);
        const loaded = await repository.loadFile("tests2/test2.txt");
        expect(loaded).exist;
        expect(loaded!!.mimeType).eq("text/plain");
        expect(await streamToString(loaded!!.readableStream)).eq(testText);

        const directories = await repository.listFiles("tests2/");
        expect(directories).exist;
        expect(directories!!.length).eq(1);
        expect(directories!![0]).eq("test2.txt");

        await repository.delete("tests2/test2.txt");
        expect((await repository.listFiles("tests2/"))!!.length).eq(0);

        expect(await repository.loadFile("tests2/test2.txt")).undefined;

        expect((await repository.listFiles("non/existing/directory/"))!!.length).eq(0);
    }).timeout(5000);

});

