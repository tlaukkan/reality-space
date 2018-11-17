import {Element, xml2js} from "xml-js";

export class Fragment {

    container: Element;
    rootElement: Element;
    entities: Element[];

    constructor(container: Element, rootElement: Element, entities: Element[]) {
        this.container = container;
        this.rootElement = rootElement;
        this.entities = entities;
    }

}