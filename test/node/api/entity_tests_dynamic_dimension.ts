import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../src/node/server/RealityServer";
import {DocumentController} from "../../../src/node/storage/DocumentController";
import {newStorageClientDynamicDimension, resetStorage, startLocalTestServer} from "../util/util";
import {parseRootSids} from "../../../src/node/util/parser";
import {xml2js} from "xml-js";
import {User} from "../../../src/common/dataspace/api/User";
import * as fs from "fs";

describe('Storage API / Testing entity resource ...', () => {
    const client = newStorageClientDynamicDimension();
    let server: RealityServer;
    let parser: DocumentController;

    before(async () => {
        server = await startLocalTestServer();
        parser = server.storageManager!!.storages.get("default")!!.get("test")!!.documentController;
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });


    it('It should add entity.', async () => {

        fs.unlinkSync("repository/dimensions/dynamic-1/processors/test/entities.xml");

        if (!await client.getUser("1")) {
            await client.addUser(new User("1", "test", []));
        }

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

});