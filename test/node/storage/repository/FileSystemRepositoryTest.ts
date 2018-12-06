import {expect} from 'chai';
import {S3Repository} from "../../../../src/node/storage/repository/S3Repository";
import {FileSystemRepository} from "../../../../src/node/storage/repository/FileSystemRepository";

describe('File System Repository Test.', () => {

    it('Should test file system repository', async () => {
        const repository = new FileSystemRepository();
        await repository.save("data/test.txt", "test");
        const loaded = await repository.load("data/test.txt");
        expect(loaded).eq("test");
        await repository.delete("data/test.txt");
        expect(await repository.load("data/test.txt")).eq("");
    });

});