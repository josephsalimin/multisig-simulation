'use strict';

const http = require("http");
const server = require("./app/server");
const port = 3000;

const onListen = function() {
    console.log("Server is running");
}

http.createServer(server)
    .listen(port, onListen);