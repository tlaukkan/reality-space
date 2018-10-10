import {js2xml, xml2js, Element, Attributes} from "xml-js";

export class Sanitizer {

    private enabled: boolean;
    private allowedElements: Set<string>;
    private allowedAttributes: Set<string>;
    private attributeValueRegex: RegExp;

    constructor(allowedElements: string, allowedAttributes: string, attributeValueRegex: string) {
        this.enabled = !(allowedElements.length === 0 && allowedAttributes.length === 0 && attributeValueRegex.length === 0);
        this.allowedElements = new Set(allowedElements.split(','));
        this.allowedAttributes = new Set(allowedAttributes.split(','));
        this.attributeValueRegex = new RegExp(attributeValueRegex, 'g');
    }

    sanitize(description: string) : string {
        if (!this.enabled) {
            return description;
        }
        const element = xml2js(description);
        this.sanitizeElements(element.elements);
        return js2xml(element, {spaces: 4});
    }

    private sanitizeElements(elements: Array<Element>) {
        for (var i = elements.length - 1; i >= 0; --i) {
           const element = elements[i];
           if (element.type == "element" && this.allowedElements.has(element.name!!)) {
               this.sanitizeElement(element);
           } else {
               elements.splice(i, 1);
           }
        };
    }

    private sanitizeElement (element: Element) {
        if (element.attributes) {
            this.sanitizeAttributes(element.attributes);
        }
        if (element.elements) {
            this.sanitizeElements(element.elements);
        }
    }

    private sanitizeAttributes(attributes: Attributes) {
        Object.keys(attributes).forEach(key => {
            if (this.allowedAttributes.has(key)) {
                if (typeof attributes[key] === 'string') {
                    attributes[key] = (attributes[key] as string).replace(this.attributeValueRegex, '')
                }
            } else {
                delete attributes[key];
            }
        });
    }

}