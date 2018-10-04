import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../src/common/dataspace/Encode";
import {Decode} from "../../../src/common/dataspace/Decode";

describe('Test Encode', () => {

    it('should encode and decode add', () => {
        const encoded = Encode.add("0", 1.011, 2.011, 3.011, 4.011, 5.011, 6.011, 7.011, "d");
        const decoded: [string, number, number, number, number, number, number, number, string] = Decode.add(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal("0");
        expect(decoded[1]).to.equal(1.01);
        expect(decoded[2]).to.equal(2.01);
        expect(decoded[3]).to.equal(3.01);
        expect(decoded[4]).to.equal(4.01);
        expect(decoded[5]).to.equal(5.01);
        expect(decoded[6]).to.equal(6.01);
        expect(decoded[7]).to.equal(7.01);
        expect(decoded[8]).to.equal("d");
    });

    it('should encode and decode added', () => {
        const encoded = Encode.added(0, "1", 1.011, 2.011, 3.011, 4.011, 5.011, 6.011, 7.011, "d");
        const decoded: [number, string, number, number, number, number, number, number, number, string] = Decode.added(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal("1");
        expect(decoded[2]).to.equal(1.01);
        expect(decoded[3]).to.equal(2.01);
        expect(decoded[4]).to.equal(3.01);
        expect(decoded[5]).to.equal(4.01);
        expect(decoded[6]).to.equal(5.01);
        expect(decoded[7]).to.equal(6.01);
        expect(decoded[8]).to.equal(7.01);
        expect(decoded[9]).to.equal("d");
    });

    it('should encode and decode update', () => {
        const encoded = Encode.update("0", 1.011, 2.011, 3.011, 4.011, 5.011, 6.011, 7.011);
        const decoded: [string, number, number, number, number, number, number, number] = Decode.update(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal("0");
        expect(decoded[1]).to.equal(1.01);
        expect(decoded[2]).to.equal(2.01);
        expect(decoded[3]).to.equal(3.01);
        expect(decoded[4]).to.equal(4.01);
        expect(decoded[5]).to.equal(5.01);
        expect(decoded[6]).to.equal(6.01);
        expect(decoded[7]).to.equal(7.01);
    });

    it('should encode and decode updated', () => {
        const encoded = Encode.updated(0, 1.011, 2.011, 3.011, 4.011, 5.011, 6.011, 7.011);
        const decoded: [number, number, number, number, number, number, number, number] = Decode.updated(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal(1.01);
        expect(decoded[2]).to.equal(2.01);
        expect(decoded[3]).to.equal(3.01);
        expect(decoded[4]).to.equal(4.01);
        expect(decoded[5]).to.equal(5.01);
        expect(decoded[6]).to.equal(6.01);
        expect(decoded[7]).to.equal(7.01);
    });

    it('should encode and decode remove', () => {
        const encoded = Encode.remove("0");
        const decoded: [string] = Decode.remove(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal("0");
    });

    it('should encode and decode removed', () => {
        const encoded = Encode.removed(0, "1");
        const decoded: [number, string] = Decode.removed(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal("1");
    });

    it('should encode and decode describe', () => {
        const encoded = Encode.describe("0", "1");
        const decoded: [string, string] = Decode.describe(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal("0");
        expect(decoded[1]).to.equal("1");
    });

    it('should encode and decode described', () => {
        const encoded = Encode.removed(0, "1");
        const decoded: [number, string] = Decode.described(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal("1");
    });

    it('should encode and decode act', () => {
        const encoded = Encode.act("0", "1");
        const decoded: [string, string] = Decode.act(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal("0");
        expect(decoded[1]).to.equal("1");
    });

    it('should encode and decode acted', () => {
        const encoded = Encode.acted(0, "1");
        const decoded: [number, string] = Decode.acted(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal("1");
    });

    it('should encode and decode acted with separator in action', () => {
        const encoded = Encode.acted(0, "a|b\\2");
        const decoded: [number, string] = Decode.acted(encoded.split(Encode.SEPARATOR));
        expect(decoded[0]).to.equal(0);
        expect(decoded[1]).to.equal("a\\\\2b\\\\12");
    });
});