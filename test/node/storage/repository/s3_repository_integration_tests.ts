import {expect} from 'chai';
import {S3Repository} from "../../../../src/node/storage/repository/S3Repository";

describe('S3 Repository Test.', () => {

    it('Should test S3 repository', async () => {
        const repository = new S3Repository('dataspace-eu');
        await repository.startup();
        await repository.save("data/test.txt", "test");
        const loaded = await repository.load("data/test.txt");
        expect(loaded).eq("test");
        await repository.delete("data/test.txt");
        expect(await repository.load("data/test.txt")).eq("");
    });


});