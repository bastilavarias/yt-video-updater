const express = require("express");
const morgan = require("morgan");
const { createWriteStream } = require("fs");
const { join } = require("path");
const responseFilter = require("./middlewares/response-filter");
const bodyParser = require("body-parser");
const cors = require("cors");

const server = express();

server.use(cors());
server.use(
    morgan("combined", {
        stream: createWriteStream(join(__dirname, "access.log"), {
            flags: "a",
        }),
    }),
);
server.use(responseFilter());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

const port = 2003;
server.listen(port, () => {
    console.log(`Service running at localhost:${port}`);
});