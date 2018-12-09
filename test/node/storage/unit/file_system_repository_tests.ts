import {expect} from 'chai';
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";

describe('File System Repository Test.', () => {

    it('Should test file system repository', async () => {
        const repository = new FileSystemRepository();
        await repository.startup();
        await repository.save("0_0_0/test.txt", "test");
        const loaded = await repository.load("0_0_0/test.txt");
        expect(loaded).eq("test");
        await repository.delete("0_0_0/test.txt");
        expect(await repository.load("0_0_0/test.txt")).eq("");
    });

});