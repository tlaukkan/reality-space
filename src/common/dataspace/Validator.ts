import {js2xml, xml2js, Element, Attributes} from "xml-js";

export class Validator {

    private static elementNames: Set<string> = new Set(['a-box']);

    private static attributeNames: Set<string> = new Set(['scale']);

    static sanitize(description: string) : string {
        console.log(description);
        const element = xml2js(description);

        console.log(JSON.stringify(element));
        this.sanitizeElements(element.elements);
        console.log(JSON.stringify(element));

        return js2xml(element, {spaces: 4});
    }

    private static sanitizeElements(elements: Array<Element>) {
        for (var i = elements.length - 1; i >= 0; --i) {
           const element = elements[i];
           console.log(element.type + ":" + element.name);
           if (element.type == "element" && this.elementNames.has(element.name!!)) {
               this.sanitizeElement(element);
           } else {
               elements.splice(i, 1);
           }
        };
    }

    private static sanitizeElement (element: Element) {
        if (element.attributes) {
            this.sanitizeAttributes(element.attributes);
        }
        if (element.elements) {
            this.sanitizeElements(element.elements);
        }
    }

    private static sanitizeAttributes(attributes: Attributes) {
        Object.keys(attributes).forEach(key => {
            if (this.attributeNames.has(key)) {

            } else {
                delete attributes[key];
            }
        });
    }

}