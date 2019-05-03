'use strict';

// Express
const express = require("express");
const bodyParser = require("body-parser");
require("express-async-errors");
// Database
const DB = require("./DatabaseManager");
DB.initiate();
// Server
const morgan = require("morgan");
const server = express();
const txController = require("./TxController");

server.use(morgan("dev"));
server.use(bodyParser.json());
// Just normal message
server.get("/", async (req, res) => {
    res.json({ message: "Ok" })
});
// New KeyPair Creation
server.post("/tx/account", txController.createNewAccount);
server.post("/tx/escrow", txController.initiateNewEscrow);
server.post("/tx/escrow/participator", txController.addParticipators);
server.post("/tx/escrow/fund", txController.sendFund);
server.post("/tx/escrow/withdrawal", txController.initiateWithdrawal);
server.post("/tx/escrow/sign", txController.sign);

module.exports= server;
