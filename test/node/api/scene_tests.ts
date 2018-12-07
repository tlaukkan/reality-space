import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../src/node/server/DataSpaceServer";
import {SceneController} from "../../../src/node/storage/SceneController";
import {newStorageClient, resetStorage, startTestServer} from "../util/util";

describe('Storage API / Testing users resource ...', () => {
    const client = newStorageClient();
    let server: DataSpaceServer;
    let parser: SceneController;

    before(async () => {
        server = await startTestServer();
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

        const loadedFragmentXml = await client.getEntitiesXml();
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

        const loadedFragmentXml = await client.getEntitiesXml();
        const loadedFragment = parser.parseFragment(loadedFragmentXml);
        expect(loadedFragment.entities.length).equal(1);
        expect(loadedFragment.entities[0].name).equal('a-box');
        expect((loadedFragment.entities[0].attributes as any).text).equal('a');
        expect((loadedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        await client.removeSceneFragment(addedFragmentXml);

        const loadedFragmentXml2 = await client.getEntitiesXml();
        const loadedFragment2 = parser.parseFragment(loadedFragmentXml2);
        expect(loadedFragment2.entities.length).equal(0);

        expect(await client.getScene()).eq(SceneController.EMPTY_FRAGMENT);
    });
});