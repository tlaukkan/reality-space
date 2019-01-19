import {Element, js2xml, xml2js} from "xml-js";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Fragment} from "./model/Fragment";
import uuid = require("uuid");
import {FragmentElement} from "./model/FragmentElement";

export class DocumentController {

    static FRAGMENT_ROOT_ELEMENT = "a-entities";
    static EMPTY_FRAGMENT = '<'+ DocumentController.FRAGMENT_ROOT_ELEMENT+'/>';

    sanitizer: Sanitizer;
    document: Fragment;
    elements: Map<string, FragmentElement> = new Map<string, FragmentElement>();

    constructor(sanitizer: Sanitizer) {
        this.sanitizer = sanitizer;
        this.document = this.parse(DocumentController.EMPTY_FRAGMENT);
    }

    clear(): void {
        this.elements.clear();
        this.document = this.parse(DocumentController.EMPTY_FRAGMENT);
        console.log("reality server - document controller cleared.");
    }

    putRootElements(fragmentXml: string): string {
        if (!fragmentXml) {
            throw new Error("Fragment can not be empty.");
        }

        const fragment = this.parse(fragmentXml);

        if (fragment.rootElement.name != DocumentController.FRAGMENT_ROOT_ELEMENT) {
            throw Error("Invalid root element name: " + fragment.rootElement.name);
        }

        const elements = fragment.elements;
        elements.forEach(e => {
            this.saveElement(this.document.rootElement, e, true);
        });

        return js2xml(fragment.container);
    }

    putChildElements(parentSid: string, fragmentXml: string): string {
        if (!parentSid) {
            throw new Error("Parent sid is undefined.");
        }
        if (!this.elements.has(parentSid)) {
            throw new Error("Parent element does not exist.");
        }
        if (!fragmentXml) {
            throw new Error("Fragment can not be empty.");
        }


        const parentElement = this.elements.get(parentSid)!!;

        const fragment = this.parse(fragmentXml);

        if (fragment.rootElement.name != DocumentController.FRAGMENT_ROOT_ELEMENT) {
            throw Error("Invalid root element name: " + fragment.rootElement.name);
        }

        const elements = fragment.elements;
        //this.saveElements(elements);

        elements.forEach(e => {
            this.saveElement(parentElement.element, e, true);
        });

        return js2xml(fragment.container);
    }

    remove(sid: string) {
        if (!sid) {
            throw new Error("Element sid is undefined.");
        }
        if (!this.elements.has(sid)) {
            throw new Error("Element does not exist.");
        }
        const element = this.elements.get(sid)!!;

        this.removeElement(element.element);
    }

    getDocument(): string {
        return js2xml(this.document.container);
    }

    hasElement(sid: string): boolean {
        return this.elements.has(sid);
    }

    getElement(sid: string): string {
        if (!sid) {
            throw new Error("Element sid is undefined.");
        }
        if (!this.elements.has(sid)) {
            throw new Error("Element does not exist.");
        }
        const element = this.elements.get(sid)!!;
        return js2xml({ elements: [ element.element ] });
    }

    serialize(): string {
        return js2xml(this.document.container);
    }

    deserialize(documentXml: string) {
        this.document = this.parse(documentXml);
        this.elements.clear();
        this.document.elements.forEach(entity => {
            this.elements.set((entity.attributes as any).sid, new FragmentElement(this.document.rootElement, entity));
        })
    }

    private saveElement(parent: Element, element: Element, addToParent: boolean) {
        if (!element.attributes) {
            element.attributes = {};
        }
        if (!(element.attributes as any).sid) {
            (element.attributes as any).sid = uuid.v4().toString();
        }
        const sid = (element.attributes as any).sid;
        if (this.elements.has(sid)) {
            const existingElement = this.elements.get(sid)!!;
            existingElement.parent.elements!!.splice(existingElement.parent.elements!!.indexOf(existingElement.element), 1);
            existingElement.parent.elements!!.push(element);
        } else {
            // Only top elements need to be explicitely added as children are already part of tree
            if (addToParent) {
                if (!parent.elements) {
                    parent.elements = [];
                }
                parent.elements!!.push(element);
            }
        }
        this.elements.set(sid, new FragmentElement(parent, element));
        if (element.elements) {
            // Recursively save children.
            element.elements.forEach( child => this.saveElement(element, child, false));
        }
    }

    private removeElement(element: Element) {
        if (element.attributes && (element.attributes as any).sid) {
            const sid = (element.attributes as any).sid;
            //console.log("Removed: " + sid);
            if (this.elements.has(sid)) {
                const existingElement = this.elements.get(sid)!!;
                existingElement.parent.elements!!.splice(existingElement.parent.elements!!.indexOf(existingElement.element), 1);
                this.elements.delete(sid);
            }
        }
        if (element.elements) {
            // Recursively remove children.
            element.elements.forEach( child => this.removeElement(child));
        }
    }

    parse(xml: string): Fragment {
        let container = xml2js(xml) as Element;

        this.sanitizer.sanitizeElements(container.elements!!);

        let rootElement = container.elements!![0];

        if (!rootElement.elements) {
            rootElement.elements = [];
        }

        let entities = rootElement.elements!!;

        return new Fragment(container, rootElement, entities);
    }
}