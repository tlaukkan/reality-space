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


});