var config = require('./config.js');
var SyncService = require('ninya-sync-stackexchange');

var syncService = new SyncService({
    liveTable: 'users',
    workingTable: 'users_working',
    backupTable: 'users_backup',
    stackexchangeSite: 'stackoverflow',
    dbConnectionString: config.dbConnectionString,
    maxEntityCount: 150000,
    pageSize: 10,
    maxRunTime: 9 * 60 * 1000
});

syncService.safeResume();