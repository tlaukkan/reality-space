import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../src/node/server/DataSpaceServer";
import {DocumentController} from "../../../src/node/storage/DocumentController";
import {newStorageClient, resetStorage, startTestServer} from "../util/util";
import {parseRootSids} from "../../../src/node/util/parser";
import {xml2js} from "xml-js";

describe('Storage API / Testing entity resource ...', () => {
    const client = newStorageClient();
    let server: DataSpaceServer;
    let parser: DocumentController;

    before(async () => {
        server = await startTestServer();
        parser = server.storageApi!!.storages.get("test")!!.documentController;
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });

    it('It should get entity.', async () => {
        expect(await client.getRootEntities()).eq('<a-entities/>');
        expect(await client.getEntity('non-existent')).eq('');
    });

    it('It should add entity.', async () => {
        expect(await client.getRootEntities()).eq(DocumentController.EMPTY_FRAGMENT);
        const addedFragmentXml = await client.saveRootEntities('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');
        const rootSids = parseRootSids(addedFragmentXml);
        expect(rootSids.length).eq(1);

        const addedFragment = parser.parse(addedFragmentXml);
        expect(addedFragment.elements.length).equal(1);
        expect(addedFragment.elements[0].name).equal('a-box');
        expect((addedFragment.elements[0].attributes as any).text).equal('a');
        expect((addedFragment.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        const addedChildElementXml = await client.saveChildEntities(rootSids[0], '<a-entities><a-box text="a1" invalid="2"></a-box></a-entities>');
        const addedChildElementSids = parseRootSids(addedChildElementXml);
        expect(addedChildElementSids.length).eq(1);
        const childElementXml = await client.getEntity(addedChildElementSids[0]);
        const childElement = xml2js(childElementXml);
        expect(childElement.elements!![0].name).equal('a-box');
        expect((childElement.elements!![0].attributes as any).text).equal('a1');
        expect((childElement.elements!![0].attributes as any).sid.length).to.be.greaterThan(0);

        //console.log(childElementXml);

        const loadedFragmentXml = await client.getRootEntitiesFromCdn();
        const loadedFragment = parser.parse(loadedFragmentXml);
        expect(loadedFragment.elements.length).equal(1);
        expect(loadedFragment.elements[0].name).equal('a-box');
        expect((loadedFragment.elements[0].attributes as any).text).equal('a');
        expect((loadedFragment.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(loadedFragment.elements[0].elements!!.length).equal(1);
        expect(loadedFragment.elements[0].elements!![0].name).equal('a-box');
        expect((loadedFragment.elements[0].elements!![0].attributes as any).text).equal('a1');
        expect((loadedFragment.elements[0].elements!![0].attributes as any).sid.length).to.be.greaterThan(0);

    });

    it('It should remove entity.', async () => {
        expect(await client.getRootEntities()).eq(DocumentController.EMPTY_FRAGMENT);
        const addedFragmentXml = await client.saveRootEntities('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');
        const rootSids = parseRootSids(addedFragmentXml);
        expect(rootSids.length).eq(1);
        const addedFragment = parser.parse(addedFragmentXml);

        expect(addedFragment.elements.length).equal(1);
        expect(addedFragment.elements[0].name).equal('a-box');
        expect((addedFragment.elements[0].attributes as any).text).equal('a');
        expect((addedFragment.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        const loadedFragmentXml = await client.getRootEntitiesFromCdn();
        const loadedFragment = parser.parse(loadedFragmentXml);
        expect(loadedFragment.elements.length).equal(1);
        expect(loadedFragment.elements[0].name).equal('a-box');
        expect((loadedFragment.elements[0].attributes as any).text).equal('a');
        expect((loadedFragment.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        await client.removeEntity(rootSids[0]);

        const loadedFragmentXml2 = await client.getRootEntitiesFromCdn();
        const loadedFragment2 = parser.parse(loadedFragmentXml2);
        expect(loadedFragment2.elements.length).equal(0);

        expect(await client.getRootEntities()).eq(DocumentController.EMPTY_FRAGMENT);
    });
});