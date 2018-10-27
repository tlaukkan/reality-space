import {Grid} from '../../../src/common/dataspace/Grid';
import 'mocha';
import { expect } from 'chai';
import {Entity} from "../../../src/common/dataspace/Entity";
import {Connection} from "../../../src/common/dataspace/Connection";
import {Encode} from "../../../src/common/dataspace/Encode";

const connection = new Connection("");
const connection2 = new Connection("");
const connection3 = new Connection("");

describe('Test Grid', () => {

    it('should create 1k grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.cells.length).to.equal(10);
        expect(grid.cells[5][5][5].cellsInRange.length).to.equal(33);
        expect(grid.count).to.equal(10);
        expect(grid.getCell(1000, 1000, 1000)!!.xi).to.equal(0);
        expect(grid.getCell(1000, 1000, 1000)!!.yi).to.equal(0);
        expect(grid.getCell(1000, 1000, 1000)!!.zi).to.equal(0);
        expect(grid.getCell(1999, 1999, 1999)!!.xi).to.equal(9);
        expect(grid.getCell(1999, 1999, 1999)!!.yi).to.equal(9);
        expect(grid.getCell(1999, 1999, 1999)!!.zi).to.equal(9);
        expect(grid.getCell(2000, 2000, 2000)).to.equal(undefined);
    });

    it('should add and update 1 entity', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);

        expect(grid.add(connection, "1", 1001, 1002, 1003, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.add(connection2, "5", 1001, 1002, 1003, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.add(connection3, "10", 1999, 1999, 1999, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);

        const e1 = grid.getCell(1000, 1000, 1000)!!.entities[0];
        const e5 = grid.getCell(1000, 1000, 1000)!!.entities[1];
        const e10 = grid.getCell(1999, 1999, 1999)!!.entities[0];

        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities.length).to.equal(2);
        expect(grid.getCell(1999, 1999, 1999)!!.entities.length).to.equal(1);

        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].connection).to.equal(connection);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].id).to.equal("1");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].index).to.equal(0);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].x).to.equal(1001);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].y).to.equal(1002);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].z).to.equal(1003);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rx).to.equal(1);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].ry).to.equal(2);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rz).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rw).to.equal(4);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].description).to.equal("d");

        expect(grid.update("1", 1004, 1005, 1006, 5, 6, 7, 8)).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities.length).to.equal(2);
        expect(grid.getCell(1999, 1999, 1999)!!.entities.length).to.equal(1);

        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].id).to.equal("1");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].x).to.equal(1004);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].y).to.equal(1005);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].z).to.equal(1006);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rx).to.equal(5);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].ry).to.equal(6);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rz).to.equal(7);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].rw).to.equal(8);

        expect(grid.update("1", 1999, 1999, 1999, 1, 2, 3, 4)).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities.length).to.equal(1);
        expect(grid.getCell(1999, 1999, 1999)!!.entities.length).to.equal(2);

        expect(e5.connection.outQueue.size()).equals(4);
        expect(e5.connection.outQueue.dequeue()!![1]).equals("a|1|5|1001.00|1002.00|1003.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e5.connection.outQueue.dequeue()!![1]).equals("a|0|1|1001.00|1002.00|1003.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e5.connection.outQueue.dequeue()!![1]).equals("u|0|1004.00|1005.00|1006.00|5.00|6.00|7.00|8.00|");
        expect(e5.connection.outQueue.dequeue()!![1]).equals("r|0|1|");
        expect(e1.connection.outQueue.size()).equals(6);
        expect(e1.connection.outQueue.dequeue()!![1]).equals("a|0|1|1001.00|1002.00|1003.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("a|1|5|1001.00|1002.00|1003.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("u|0|1004.00|1005.00|1006.00|5.00|6.00|7.00|8.00|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("r|1|5|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("a|2|10|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("u|0|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|");
        expect(e10.connection.outQueue.size()).equals(3);
        expect(e10.connection.outQueue.dequeue()!![1]).equals("a|2|10|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e10.connection.outQueue.dequeue()!![1]).equals("a|0|1|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|d|a|");
        expect(e10.connection.outQueue.dequeue()!![1]).equals("u|0|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|");

        expect(grid.getCell(1999, 1999, 1999)!!.entities[0].id).to.equal("10");
        expect(grid.getCell(1999, 1999, 1999)!!.entities[1].id).to.equal("1");

        expect(grid.update("1", 0, 0, 0, 1, 2, 3, 4)).to.equal(false);

        expect(grid.getCell(1000, 1000, 1000)!!.entities.length).to.equal(1);
        expect(grid.getCell(1999, 1999, 1999)!!.entities.length).to.equal(2);
        expect(grid.getCell(1999, 1999, 1999)!!.entities[1].id).to.equal("1");

        grid.remove("1");
        grid.remove("5");
        grid.remove("10");
        expect(grid.getCell(1999, 1999, 1999)!!.entities.length).to.equal(0);

        expect(grid.entities.size).to.equal(0);
    });

    it('should try to add entity outside grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(connection, "0", 0, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(false);
        expect(grid.entities.size).to.equal(0);
    });

    it('should try to update entity outside grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.entities.size).to.equal(1);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].id).to.equal("0");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].x).to.equal(1000);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].y).to.equal(1000);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].z).to.equal(1000);
        expect(grid.update("0", 0, 1000, 1000, 1, 2, 3, 4)).to.equal(false);
        expect(grid.entities.size).to.equal(1);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].x).to.equal(1000);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].y).to.equal(1000);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].z).to.equal(1000);
    });

    it('should add 3 entities, remove 1 and add 1 more grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);

        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.entities.size).to.equal(1);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].id).to.equal("0");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].index).to.equal(0);

        expect(grid.add(connection, "1", 1000, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.entities.size).to.equal(2);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].id).to.equal("1");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].index).to.equal(1);

        expect(grid.add(connection, "2", 1001, 1001, 1001, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].id).to.equal("2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].index).to.equal(2);

        grid.remove("1"); // entity index 1 will be released to be reused
        expect(grid.entities.size).to.equal(2);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].id).to.equal("2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].index).to.equal(2);

        expect(grid.add(connection, "3", 1001, 1001, 1001, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].id).to.equal("3");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].index).to.equal(1); // entity index 1 was be released and reused
    });


    it('should describe entity in grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        grid.describe("0", "d2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].description).to.equal("d2");
    });

    it('should describe enqueue and dequeue message', () => {
        const c = new Connection("");

        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(c, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d", Encode.AVATAR)).to.equal(true);
        grid.queueToEntitiesInRange(grid.entities.get("0")!!, "a", "1");
        expect(c.outQueue.size()).equal(2);
        grid.queueToEntitiesInRange(grid.entities.get("0")!!, "b", "2");
        expect(c.outQueue.size()).equal(3);
        expect(c.outQueue.dequeue()!![1]).equal("a|0|0|1000.00|1000.00|1000.00|1.00|2.00|3.00|4.00|d|a|");
        expect(c.outQueue.dequeue()!![1]).equal("1");
        expect(c.outQueue.dequeue()!![1]).equal("2");
        expect(c.outQueue.size()).equal(0);
    });

    it('should add object and probe', () => {
        const c = new Connection("");

        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(c, "0", 1000, 1000, 1000, 1, 2, 3, 4, "o", Encode.OBJECT)).to.equal(true);
        expect(grid.add(c, "1", 1000, 1000, 1000, 1, 2, 3, 4, "p", Encode.PROBE)).to.equal(true);

        const o = grid.getCell(1000, 1000, 1000)!!.entities[0];
        expect(o.visible).equal(true);
        expect(o.observer).equal(false);
        const p = grid.getCell(1000, 1000, 1000)!!.entities[1];
        expect(p.visible).equal(false);
        expect(p.observer).equal(true);

        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.dequeue()!![1]).equal("a|0|0|1000.00|1000.00|1000.00|1.00|2.00|3.00|4.00|o|o|");
        expect(c.outQueue.size()).equal(0);

        expect(grid.update("0", 1001, 1000, 1000, 1, 2, 3, 4)).to.equal(true);
        expect(grid.update("1", 1001, 1000, 1000, 1, 2, 3, 4)).to.equal(true);

        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.dequeue()!![1]).equal("u|0|1001.00|1000.00|1000.00|1.00|2.00|3.00|4.00|");
        expect(c.outQueue.size()).equal(0);

        grid.act("0", "a");
        grid.act("1", "b");

        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.dequeue()!![1]).equal("c|0|a|");
        expect(c.outQueue.size()).equal(0);

        grid.describe("0", "A");
        grid.describe("1", "B");

        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.dequeue()!![1]).equal("d|0|A|");
        expect(c.outQueue.size()).equal(0);

        grid.remove("0");
        grid.remove("1");

        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.dequeue()!![1]).equal("r|0|0|");
        expect(c.outQueue.size()).equal(0);

    });


});