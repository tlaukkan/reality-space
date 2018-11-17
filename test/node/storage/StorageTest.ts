import { expect } from 'chai';
import {SceneStorage} from "../../../src/node/storage/SceneStorage";
import {Sanitizer} from "../../../src/common/dataspace/Sanitizer";
import {js2xml} from "xml-js";

describe('Storage test.', () => {

    it('should test storage', () => {
        const sanitizer = new Sanitizer('a-scene-fragment,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');
        const storage = new SceneStorage('test-scene.html', sanitizer);

        const addedFragment = storage.parseFragment(
            storage.saveSceneFragment('<a-scene-fragment><a-box text="a" invalid="2"></a-box></a-scene-fragment>'));

        expect(addedFragment.entities.length).equal(1);
        expect(addedFragment.entities[0].name).equal('a-box');
        expect((addedFragment.entities[0].attributes as any).text).equal('a');
        expect((addedFragment.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(storage.parseFragment(storage.getScene()).entities.length).equal(1);

        const addedFragment2 = storage.parseFragment(
            storage.saveSceneFragment('<a-scene-fragment><a-box text="b" invalid="2"></a-box></a-scene-fragment>'));

        expect(addedFragment2.entities.length).equal(1);
        expect(addedFragment2.entities[0].name).equal('a-box');
        expect((addedFragment2.entities[0].attributes as any).text).equal('b');
        expect((addedFragment2.entities[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(storage.parseFragment(storage.getScene()).entities.length).equal(2);

        const addedFragment2Xml = js2xml(addedFragment2.container);
        console.log(addedFragment2Xml);
        storage.removeSceneFragment(addedFragment2Xml);

        expect(storage.parseFragment(storage.getScene()).entities.length).equal(1);

        console.log(storage.getScene());
    });


});