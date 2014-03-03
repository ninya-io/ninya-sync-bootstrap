var config = require('./config.js');
var SyncService = require('ninya-sync-elasticsearch');

var syncService = new SyncService({
    batchSize: 500,
    tableName: 'users_working',
    dbConnectionString: config.dbConnectionString,
    elasticsearchEndpoint: config.elasticsearchEndpoint
});

syncService
    .createIndex()
    .then(function(){
        process.exit();
    });