import { expect } from 'chai';
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {Sanitizer} from "../../../../src/common/reality/Sanitizer";
import {js2xml} from "xml-js";
import {Storage} from "../../../../src/node/storage/Storage";
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";
import {Principal} from "../../../../src/node/http/Principal";
import {parseRootSids, parseFragment} from "../../../../src/node/util/parser";

describe('Storage test.', () => {

    it('should test storage', async () => {
        const repository = new FileSystemRepository();
        const sanitizer = new Sanitizer('a-entities,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');

        const spaceName = "default";
        const region = "test";
        let sceneFileName = "spaces/" + spaceName + "/regions/" + region + "/entities.xml";
        let accessFileName = "spaces/" + spaceName + "/regions/" + region + "/access.json";

        await repository.delete(sceneFileName);
        await repository.delete(accessFileName);

        const sceneController = new DocumentController(sanitizer);
        const storage = new Storage(spaceName, region, repository, sanitizer, false);
        await storage.startup();

        const principal = new Principal("", "", "", "1", "test-user-1", ["administrators", "modifiers"]);

        await storage.addUser(principal, principal.userId, principal.userName);
        const addedFragmentXml = await storage.saveRootElements(principal, '<a-entities><a-box text="a" invalid="2"></a-box></a-entities>');
        const addedFragment = parseFragment(addedFragmentXml);

        expect(addedFragment.elements.length).equal(1);
        expect(addedFragment.elements[0].name).equal('a-box');
        expect((addedFragment.elements[0].attributes as any).text).equal('a');
        expect((addedFragment.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(parseFragment(await storage.getDocument(principal)).elements.length).equal(1);

        const addedFragment2 = sceneController.parse(
            await storage.saveRootElements(principal, '<a-entities><a-box text="b" invalid="2"></a-box></a-entities>'));

        expect(addedFragment2.elements.length).equal(1);
        expect(addedFragment2.elements[0].name).equal('a-box');
        expect((addedFragment2.elements[0].attributes as any).text).equal('b');
        expect((addedFragment2.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(parseFragment(await storage.getDocument(principal)).elements.length).equal(2);

        const addedFragment2Xml = js2xml(addedFragment2.container);

        const rootSids = parseRootSids(addedFragment2Xml);
        await storage.removeElement(principal, rootSids[0]);

        expect(parseFragment(await storage.getDocument(principal)).elements.length).equal(1);

        await repository.save(sceneFileName, '');
        await repository.save(accessFileName, '');
    });


});