import 'mocha';
import {createIdToken, validateIdToken} from "../../../src/node/util/jwt";
const { generateKeyPairSync } = require('crypto');
const jwt = require('jsonwebtoken');
import { expect } from 'chai';

describe('Regexp Test', () => {

    it('It should test regexp.', async () => {
        var url = 'folderId=klafjlka&folderName=asdasd';
        var re = /^folderId=(.*)&folderName=(.*)$/i;
        var args = url.match(re)!!;
        console.log(args[0]);
        console.log(args[1]);
        console.log(args[2]);
        console.log("-");
    });


});

