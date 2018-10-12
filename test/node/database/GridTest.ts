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

        expect(grid.add(connection, "1", 1001, 1002, 1003, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.add(connection2, "5", 1001, 1002, 1003, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.add(connection3, "10", 1999, 1999, 1999, 1, 2, 3, 4, "d")).to.equal(true);

        const e1 = grid.getCell(1000, 1000, 1000)!!.entities[0];
        const e5 = grid.getCell(1000, 1000, 1000)!!.entities[1];
        const e10 = grid.getCell(1999, 1999, 1999)!!.entities[0];
        e1.visible = true;
        e5.visible = true;
        e10.visible = true;

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

        expect(e5.connection.outQueue.size()).equals(1);
        expect(e5.connection.outQueue.dequeue()!![1]).equals("r|0|1|");
        expect(e1.connection.outQueue.size()).equals(2);
        expect(e1.connection.outQueue.dequeue()!![1]).equals("r|1|5|");
        expect(e1.connection.outQueue.dequeue()!![1]).equals("a|2|10|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|d|");
        expect(e10.connection.outQueue.size()).equals(1);
        expect(e10.connection.outQueue.dequeue()!![1]).equals("a|0|1|1999.00|1999.00|1999.00|1.00|2.00|3.00|4.00|d|");

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
        expect(grid.add(connection, "0", 0, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(false);
        expect(grid.entities.size).to.equal(0);
    });

    it('should try to update entity outside grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(true);
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

        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.entities.size).to.equal(1);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].id).to.equal("0");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].index).to.equal(0);

        expect(grid.add(connection, "1", 1000, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.entities.size).to.equal(2);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].id).to.equal("1");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].index).to.equal(1);

        expect(grid.add(connection, "2", 1001, 1001, 1001, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].id).to.equal("2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].index).to.equal(2);

        grid.remove("1"); // entity index 1 will be released to be reused
        expect(grid.entities.size).to.equal(2);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].id).to.equal("2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[1].index).to.equal(2);

        expect(grid.add(connection, "3", 1001, 1001, 1001, 1, 2, 3, 4, "d")).to.equal(true);
        expect(grid.entities.size).to.equal(3);
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].id).to.equal("3");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[2].index).to.equal(1); // entity index 1 was be released and reused
    });


    it('should describe entity in grid', () => {
        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(connection, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(true);
        grid.describe("0", "d2");
        expect(grid.getCell(1000, 1000, 1000)!!.entities[0].description).to.equal("d2");
    });

    it('should describe enqueue and dequeue message', () => {
        const c = new Connection("");

        const grid = new Grid(1500, 1500, 1500, 1000, 100, 200);
        expect(grid.add(c, "0", 1000, 1000, 1000, 1, 2, 3, 4, "d")).to.equal(true);
        grid.queueToEntitiesInRange("0", "a", "1");
        expect(c.outQueue.size()).equal(1);
        grid.queueToEntitiesInRange("0", "b", "2");
        expect(c.outQueue.size()).equal(2);
        expect(c.outQueue.peek()!![0]).equal("a");
        expect(c.outQueue.peek()!![1]).equal("1");
        expect(c.outQueue.dequeue()!![0]).equal("a");
        expect(c.outQueue.size()).equal(1);
        expect(c.outQueue.peek()!![0]).equal("b");
        expect(c.outQueue.peek()!![1]).equal("2");
        expect(c.outQueue.dequeue()!![0]).equal("b");
        expect(c.outQueue.size()).equal(0);
    });
});