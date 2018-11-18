import { expect } from 'chai';
import {SceneController} from "../../../src/node/storage/SceneController";
import {Sanitizer} from "../../../src/common/dataspace/Sanitizer";
import {js2xml} from "xml-js";
import {Storage} from "../../../src/node/storage/Storage";
import {FileSystemRepository} from "../../../src/node/storage/repository/FileSystemRepository";
import {Context} from "../../../src/common/dataspace/Context";

describe('Storage test.', () => {

    it('should test storage', async () => {
        const repository = new FileSystemRepository();
        const sanitizer = new Sanitizer('a-scene-fragment,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');

        let sceneFileName = "data/test-scene.xml";
        let accessFileName = "data/test-access.json";

        await repository.delete(sceneFileName);
        await repository.delete(accessFileName);

        const sceneController = new SceneController(sanitizer);
        const storage = new Storage(sceneFileName, accessFileName, repository, sanitizer);
        await storage.startup();

        const context = new Context("1", "test-user-1");

        if (!storage.hasUser(context, context.userId)) {
            storage.addUser(context, context.userId, context.userName);
        }
        const addedFragment = sceneController.parseFragment(
            storage.saveSceneFragment(context, '<a-scene-fragment><a-box text="a" invalid="2"></a-box></a-scene-fragment>'));

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(sceneController.parseFragment(storage.getScene(context)).entities.length).equal(1);

        const addedFragment2 = sceneController.parseFragment(
            storage.saveSceneFragment(context, '<a-scene-fragment><a-box text="b" invalid="2"></a-box></a-scene-fragment>'));

        expect(addedFragment2.entities.length).equal(1);
        expect(addedFragment2.entities[0].name).equal('a-box');
        expect((addedFragment2.entities[0].attributes as any).text).equal('b');
        expect((addedFragment2.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(sceneController.parseFragment(storage.getScene(context)).entities.length).equal(2);

        const addedFragment2Xml = js2xml(addedFragment2.container);
        console.log(addedFragment2Xml);
        storage.removeSceneFragment(context, addedFragment2Xml);

        expect(sceneController.parseFragment(storage.getScene(context)).entities.length).equal(1);

        await repository.save(sceneFileName, '');
        await repository.save(accessFileName, '');
    });


});