const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';

const dbName = 'chatSystem';

let _db;

const mongoConnect = callback => {
    MongoClient.connect(url, function (err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        _db = client.db(dbName);
        callback();
    });
}



const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No database found!';
};

exports.getDb = getDb;
exports.mongoConnect = mongoConnect;