import {Element, js2xml, xml2js} from "xml-js";

export class FragmentElement {
    
    parent: Element;
    element: Element;
    
    constructor(parent: Element, element: Element) {
        this.parent = parent;
        this.element = element;
    }
}