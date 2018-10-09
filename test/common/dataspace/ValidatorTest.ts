import { expect } from 'chai';
import {Validator} from "../../../src/common/dataspace/Validator";

describe('Validator test.', () => {

    it('should test validator', () => {
        const description = '<a-box postion="0 0 0" orientation="0 0 0" scale="1 1 1"><a-sphere></a-sphere><a-box>test</a-box></a-box>';
        const sanitized = Validator.sanitize(description);
        console.log(sanitized);
    });

});