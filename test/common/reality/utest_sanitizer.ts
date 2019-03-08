import { expect } from 'chai';
import {Sanitizer} from "../../../src/common/reality/Sanitizer";

describe('Sanitizer test.', () => {

    it('should test sanitizer', () => {
        const sanitizer = new Sanitizer('a-box', 'scale', '[^\\w\\s:;]');
        const description = '<a-box postion="0 0 0" orientation="0 0 0" scale=":;<>1 1 1"><a-sphere></a-sphere><a-box scale="javascript: xxx">test</a-box></a-box>';
        const sanitized = sanitizer.sanitize(description);
        expect("<a-box scale=\":;1 1 1\">\n" +
            "    <a-box scale=\": xxx\"/>\n" +
            "</a-box>").equals(sanitized);
    });

    it('should test sanitizer with forbidden root element', () => {
        const sanitizer = new Sanitizer('a-box', 'scale', '[^\\w\\s:;]');
        const description = '<a-sphere/>';
        const sanitized = sanitizer.sanitize(description);
        expect('').equals(sanitized);
    });


    it('should test sanitizer inject attributes', () => {
        const attributesToInject: Map<string, string> = new Map([
            ["test-inject-key-1", "test-inject-value-1"],
            ["test-inject-key-2", "test-inject-value-2"]
        ]);

        const sanitizer = new Sanitizer('a-box', 'scale', '[^\\w\\s:;]');
        const description = '<a-box postion="0 0 0" orientation="0 0 0" scale=":;<>1 1 1"><a-sphere></a-sphere><a-box scale="javascript: xxx">test</a-box></a-box>';
        const sanitized = sanitizer.sanitize(description, attributesToInject);
        expect("<a-box scale=\":;1 1 1\" test-inject-key-1=\"test-inject-value-1\" test-inject-key-2=\"test-inject-value-2\">\n" +
            "    <a-box scale=\": xxx\"/>\n" +
            "</a-box>").equals(sanitized);
    });
});