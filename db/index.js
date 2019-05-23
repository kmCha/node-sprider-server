var MongoClient = require('mongodb').MongoClient

var dbClient = new MongoClient('mongodb://localhost:27017')

module.exports = async function getDBClient () {
  return await dbClient.connect()
}