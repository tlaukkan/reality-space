import { expect } from 'chai';
import {SceneController} from "../../../../src/node/storage/SceneController";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {js2xml} from "xml-js";
import {Storage} from "../../../../src/node/storage/Storage";
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";
import {Principal} from "../../../../src/node/framework/rest/Principal";

describe('Storage test.', () => {

    it('should test storage', async () => {
        const repository = new FileSystemRepository();
        const sanitizer = new Sanitizer('a-entities,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');

        let sceneFileName = "test/entities.xml";
        let accessFileName = "test/access.json";

        await repository.delete(sceneFileName);
        await repository.delete(accessFileName);

        const sceneController = new SceneController(sanitizer);
        const storage = new Storage(sceneFileName, accessFileName, repository, sanitizer);
        await storage.startup();

        const principal = new Principal("", "", "", "1", "test-user-1");

        storage.addUser(principal, principal.userId, principal.userName);
        const addedFragment = sceneController.parseFragment(
            storage.saveSceneFragment(principal, '<a-entities><a-box text="a" invalid="2"></a-box></a-entities>'));

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(sceneController.parseFragment(storage.getScene(principal)).entities.length).equal(1);

        const addedFragment2 = sceneController.parseFragment(
            storage.saveSceneFragment(principal, '<a-entities><a-box text="b" invalid="2"></a-box></a-entities>'));

        expect(addedFragment2.entities.length).equal(1);
        expect(addedFragment2.entities[0].name).equal('a-box');
        expect((addedFragment2.entities[0].attributes as any).text).equal('b');
        expect((addedFragment2.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(sceneController.parseFragment(storage.getScene(principal)).entities.length).equal(2);

        const addedFragment2Xml = js2xml(addedFragment2.container);
        console.log(addedFragment2Xml);
        storage.removeSceneFragment(principal, addedFragment2Xml);

        expect(sceneController.parseFragment(storage.getScene(principal)).entities.length).equal(1);

        await repository.save(sceneFileName, '');
        await repository.save(accessFileName, '');
    });


});