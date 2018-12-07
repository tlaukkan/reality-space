import {Fragment} from "../storage/model/Fragment";
import {Element, xml2js} from "xml-js";

export function parseFragment(fragmentXml: string): Fragment {
    let container = xml2js(fragmentXml) as Element;

    let rootElement = container.elements!![0];

    if (!rootElement.elements) {
        rootElement.elements = [];
    }

    let entities = rootElement.elements!!;

    return new Fragment(container, rootElement, entities);
}

export function parseEntitySids(entitiesXml: string): Array<string> {
    let container = xml2js(entitiesXml) as Element;
    let rootElement = container.elements!![0];
    if (!rootElement.elements) {
        rootElement.elements = [];
    }
    let entities = rootElement.elements!!;
    return entities.map(entity => (entity.attributes as any).sid as string);
}
