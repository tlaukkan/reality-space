import { expect } from 'chai';
import {SceneController} from "../../../src/node/storage/SceneController";
import {Sanitizer} from "../../../src/common/dataspace/Sanitizer";
import {js2xml} from "xml-js";

describe('Scene controller test.', () => {

    it('should test scene controller', () => {
        const sanitizer = new Sanitizer('a-entities,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');
        const storage = new SceneController(sanitizer);

        const addedFragment = storage.parseFragment(
            storage.saveSceneFragment('<a-entities><a-box text="a" invalid="2"></a-box></a-entities>'));

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(storage.parseFragment(storage.serialize()).entities.length).equal(1);

        const addedFragment2 = storage.parseFragment(
            storage.saveSceneFragment('<a-entities><a-box text="b" invalid="2"></a-box></a-entities>'));

        expect(addedFragment2.entities.length).equal(1);
        expect(addedFragment2.entities[0].name).equal('a-box');
        expect((addedFragment2.entities[0].attributes as any).text).equal('b');
        expect((addedFragment2.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(storage.parseFragment(storage.serialize()).entities.length).equal(2);

        const addedFragment2Xml = js2xml(addedFragment2.container);
        console.log(addedFragment2Xml);
        storage.removeSceneFragment(addedFragment2Xml);

        expect(storage.parseFragment(storage.serialize()).entities.length).equal(1);

        const scene = storage.serialize();

        const storage2 = new SceneController(sanitizer);
        storage2.deserialize(scene);

        expect(storage.parseFragment(storage2.serialize()).entities.length).equal(1);
        expect(storage2.serialize()).equals(scene);
    });


});