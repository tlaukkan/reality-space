import {Element, js2xml, xml2js} from "xml-js";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Fragment} from "./model/Fragment";
import uuid = require("uuid");
import {AccessModel} from "./model/AccessModel";

export class SceneController {

    SCENE_FRAGMENT_ELEMENT = "a-scene-fragment";

    sanitizer: Sanitizer;
    scene: Fragment;
    entityMap: Map<string, Element> = new Map<string, Element>();

    constructor(sanitizer: Sanitizer) {
        this.sanitizer = sanitizer;
        this.scene = this.parseFragment('<a-scene></a-scene>');
    }

    clear(): void {
        this.scene = this.parseFragment('<a-scene></a-scene>');
    }

    saveSceneFragment(sceneFragment: string): string {
        if (!sceneFragment) {
            throw new Error("Scene fragment can not be empty.");
        }

        const fragment = this.parseFragment(sceneFragment);

        if (fragment.rootElement.name != this.SCENE_FRAGMENT_ELEMENT) {
            throw Error("Invalid root element name: " + fragment.rootElement.name);
        }

        const entities = fragment.entities;
        this.saveEntities(entities);

        return js2xml(fragment.container);
    }

    removeSceneFragment(sceneFragment: string) {
        if (!sceneFragment) {
            throw new Error("Scene fragment can not be empty.");
        }

        const fragment = this.parseFragment(sceneFragment);

        if (fragment.rootElement.name != this.SCENE_FRAGMENT_ELEMENT) {
            throw Error("Invalid root element name: " + fragment.rootElement.name);
        }

        this.removeEntities(fragment.entities);
    }

    getScene(): string {
        return js2xml(this.scene.container);
    }

    serialize(): string {
        return js2xml(this.scene.container);
    }

    deserialize(scene: string) {
        this.scene = this.parseFragment(scene);
        this.entityMap.clear();
        this.scene.entities.forEach(entity => {
            this.entityMap.set((entity.attributes as any).sid, entity);
        })
    }

    private saveEntities(entities: Element[]) {
        for (let i = entities.length - 1; i >= 0; --i) {
            const entity = entities[i];
            if (!entity.attributes) {
                entity.attributes = {};
            }
            if (!(entity.attributes as any).sid) {
                (entity.attributes as any).sid = uuid.v4().toString();
            }
            const sid = (entity.attributes as any).sid;
            if (this.entityMap.has(sid)) {
                const existingElement = this.entityMap.get(sid)!!;
                this.scene.entities.splice(this.scene.entities.indexOf(existingElement), 1);
            }
            this.entityMap.set(sid, entity);
            this.scene.entities!!.push(entity);
        }
    }

    private removeEntities(entities: Element[]) {
        for (let i = entities.length - 1; i >= 0; --i) {
            const entity = entities[i];
            if (entity.attributes && (entity.attributes as any).sid) {
                const sid = (entity.attributes as any).sid;
                if (this.entityMap.has(sid)) {
                    const existingElement = this.entityMap.get(sid)!!;
                    this.scene.entities.splice(this.scene.entities.indexOf(existingElement), 1);
                    this.entityMap.delete(sid);
                }
            }
        }
    }

    parseFragment(fragmentXml: string): Fragment {
        let container = xml2js(fragmentXml) as Element;

        this.sanitizer.sanitizeElements(container .elements!!);

        let rootElement = container.elements!![0];

        if (!rootElement.elements) {
            rootElement.elements = [];
        }

        let entities = rootElement.elements!!;

        return new Fragment(container, rootElement, entities);
    }
}