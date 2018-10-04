import {Grid} from "../common/dataspace/Grid";
import {Processor} from "../common/dataspace/Processor";
import {Server} from "../common/dataspace/Server";

const server = new Server(
    '0.0.0.0',
    process.env.PORT as any || 8889,
    new Processor(
        new Grid(
            process.env.GRID_CX as any || 0,
            process.env.GRID_CY as any || 0,
            process.env.GRID_CZ as any || 0,
            process.env.GRID_EDGE as any || 1000,
            process.env.GRID_STEP  as any || 100,
            process.env.GRID_RANGE as any || 200
        )));
server.listen();

process.on('exit', function() {
    server.close();
});