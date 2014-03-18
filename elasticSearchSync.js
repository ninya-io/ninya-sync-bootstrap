var config = require('./config.js');
var SyncService = require('ninya-sync-elasticsearch');

var syncService = new SyncService({
    batchSize: 350,
    tableName: 'users_working',
    elasticsearchIndex: 'production_v4',
    stackexchangeSite: 'stackoverflow',
    dbConnectionString: config.dbConnectionString,
    elasticsearchEndpoint: config.elasticsearchEndpoint
});

syncService
    .createIndex()
    .then(function(){
        process.exit();
    });


//let it run for a maximum of 9 minutes to not have jobs queing up
setTimeout(function(){
    process.exit();
}, 9 * 60 * 1000);