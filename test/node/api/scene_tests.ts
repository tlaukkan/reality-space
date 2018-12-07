import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../util/util";
import {StorageClient} from "../../../src/common/dataspace/api/StorageClient";
import {SceneController} from "../../../src/node/storage/SceneController";

describe('Storage API / Testing users resource ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("test", "http://127.0.0.1:8889/api", "http://localhost:8889/repository", idToken);
    let parser: SceneController;

    before(async () => {
        server = await startTestServer(server);
        parser = server.storageApi!!.storages.get("test")!!.sceneController;
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
        const addedFragmentXml = await client.saveSceneFragment('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');

        const addedFragment = parser.parseFragment(addedFragmentXml);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        const loadedFragmentXml = await client.getSceneFromAssets();
        const loadedFragment = parser.parseFragment(loadedFragmentXml);
        expect(loadedFragment.entities.length).equal(1);
        expect(loadedFragment.entities[0].name).equal('a-box');
        expect((loadedFragment.entities[0].attributes as any).text).equal('a');
        expect((loadedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

    });

    it('It should remove scene fragment.', async () => {
        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
        const addedFragmentXml = await client.saveSceneFragment('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');
        const addedFragment = parser.parseFragment(addedFragmentXml);

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        const loadedFragmentXml = await client.getSceneFromAssets();
        const loadedFragment = parser.parseFragment(loadedFragmentXml);
        expect(loadedFragment.entities.length).equal(1);
        expect(loadedFragment.entities[0].name).equal('a-box');
        expect((loadedFragment.entities[0].attributes as any).text).equal('a');
        expect((loadedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        await client.removeSceneFragment(addedFragmentXml);

        const loadedFragmentXml2 = await client.getSceneFromAssets();
        const loadedFragment2 = parser.parseFragment(loadedFragmentXml2);
        expect(loadedFragment2.entities.length).equal(0);

        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
    });
});