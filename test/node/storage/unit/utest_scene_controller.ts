import { expect } from 'chai';
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {Sanitizer} from "../../../../src/common/reality/Sanitizer";
import {js2xml, xml2js} from "xml-js";
import {parseRootSids, parseFragment} from "../../../../src/node/util/parser";

describe('Scene controller test.', () => {

    it('should test scene controller', () => {
        const sanitizer = new Sanitizer('a-entities,a-scene,a-box', 'text,sid,scale', '[^\\w\\s:;-]');
        const storage = new DocumentController(sanitizer);

        const addedFragmentXml =
            storage.putRootElements('<a-entities><a-box text="a" invalid="2"><a-box text="a1"></a-box></a-box></a-entities>');
        const rootSids = parseRootSids(addedFragmentXml);
        expect(rootSids.length).eq(1);
        const addedChildElementXml = storage.putChildElements(rootSids[0], "<a-entities><a-box text=\"a2\"></a-box></a-entities>");
        const addedChildSids = parseRootSids(addedChildElementXml);
        expect(addedChildSids.length).eq(1);
        const childElementXml = storage.getElement(addedChildSids[0]);
        const childElement = xml2js(childElementXml);

        //console.log(addedChildElementXml);
        expect(childElement.elements[0].name).equal('a-box');
        expect((childElement.elements[0].attributes as any).text).equal('a2');
        expect((childElement.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        const documentXmlAfterFirstAdd = parseFragment(storage.serialize());

        //console.log(addedFragment);

        expect(documentXmlAfterFirstAdd.elements.length).equal(1);
        expect(documentXmlAfterFirstAdd.elements[0].name).equal('a-box');
        expect((documentXmlAfterFirstAdd.elements[0].attributes as any).text).equal('a');
        expect((documentXmlAfterFirstAdd.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(documentXmlAfterFirstAdd.elements[0].elements!!.length).equal(2);
        expect(documentXmlAfterFirstAdd.elements[0].elements!![0].name).equal('a-box');
        expect((documentXmlAfterFirstAdd.elements[0].elements!![0].attributes as any).text).equal('a1');
        expect(documentXmlAfterFirstAdd.elements[0].elements!![1].name).equal('a-box');
        expect((documentXmlAfterFirstAdd.elements[0].elements!![1].attributes as any).text).equal('a2');

        expect(parseFragment(storage.serialize()).elements.length).equal(1);

        storage.putRootElements(addedFragmentXml);

        expect(parseFragment(storage.serialize()).elements.length).equal(1);



        const addedFragment2 = parseFragment(
            storage.putRootElements('<a-entities><a-box text="b" invalid="2"></a-box></a-entities>'));

        expect(addedFragment2.elements.length).equal(1);
        expect(addedFragment2.elements[0].name).equal('a-box');
        expect((addedFragment2.elements[0].attributes as any).text).equal('b');
        expect((addedFragment2.elements[0].attributes as any).sid.length).to.be.greaterThan(0);

        expect(parseFragment(storage.serialize()).elements.length).equal(2);
        storage.remove(rootSids[0]);

        const documentXmlAfterRemove = storage.serialize();
        //console.log(documentXmlAfterRemove);
        expect(parseFragment(documentXmlAfterRemove).elements.length).equal(1);

        const scene = storage.serialize();

        const storage2 = new DocumentController(sanitizer);
        storage2.deserialize(scene);

        expect(parseFragment(storage2.serialize()).elements.length).equal(1);
        expect(storage2.serialize()).equals(scene);
    });


});