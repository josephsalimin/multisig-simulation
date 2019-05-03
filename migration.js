const Promise = require("bluebird");
const sqlite = require("sqlite");

const db = Promise.resolve()
    .then(() => sqlite.open('./db.sqlite'), { Promise })
    .then(db => db.migrate({ force: 'last' }));
