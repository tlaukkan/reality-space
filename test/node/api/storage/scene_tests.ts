import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";
import {User} from "../../../../src/common/dataspace/api/User";
import {SceneController} from "../../../../src/node/storage/SceneController";

describe('Storage API / Testing users resource ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("http://127.0.0.1:8889/api", "test", idToken);

    before(async () => {
        server = await startTestServer(server);
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });

    it('It should get scene.', async () => {
        expect(await client.getScene()).eq('<a-entities/>');
    });

    it('It should add scene fragment.', async () => {
        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
        const sceneFragment = await client.saveSceneFragment('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');

        const addedFragment = server.storageApi!!.storages.get("test")!!.sceneController.parseFragment(sceneFragment);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);
    });

    it('It should remove scene fragment.', async () => {
        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
        const sceneFragment = await client.saveSceneFragment('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');

        const addedFragment = server.storageApi!!.storages.get("test")!!.sceneController.parseFragment(sceneFragment);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);
        await client.removeSceneFragment(sceneFragment);

        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
    });
});