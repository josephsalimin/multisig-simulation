const Promise = require('bluebird');
const sqlite = require('sqlite');

class DatabaseManager {

    static initiate() {
        this.dbPromise = sqlite.open('./db.sqlite', { Promise });
    }

    static async database() {
        return await this.dbPromise;
    }

}

DatabaseManager.dbPromise = null;

module.exports = DatabaseManager;