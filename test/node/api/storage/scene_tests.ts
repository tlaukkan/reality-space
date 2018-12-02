import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";
import {User} from "../../../../src/common/dataspace/api/User";

describe('Storage API / Testing users resource ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("http://127.0.0.1:8889/api", idToken);

    before(async () => {
        server = await startTestServer(server);
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(function() {
        server.close();
    });

    it('It should get scene.', async () => {
        expect(await client.getScene()).eq('<a-scene/>');
    });

    it('It should add scene fragment.', async () => {
        expect(await client.getScene()).eq('<a-scene/>');
        const sceneFragment = await client.saveSceneFragment('<a-scene-fragment><a-box text="a" invalid="2"></a-box></a-scene-fragment>');

        const addedFragment = server.storageApi.storage.sceneController.parseFragment(sceneFragment);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);
    });

    it('It should remove scene fragment.', async () => {
        expect(await client.getScene()).eq('<a-scene/>');
        const sceneFragment = await client.saveSceneFragment('<a-scene-fragment><a-box text="a" invalid="2"></a-box></a-scene-fragment>');

        const addedFragment = server.storageApi.storage.sceneController.parseFragment(sceneFragment);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);
        await client.removeSceneFragment(sceneFragment);

        expect(await client.getScene()).eq('<a-scene/>');
    });
});