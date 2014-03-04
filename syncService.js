/* options.liveTable = users,
   options.workingTable = users_working,
   options.backupTable = users_backup,
   options.dbConnectionString,
   options.maxEntityCount = 150000,
   options.pageSize = 10,
   options.maxRunTime = 9 * 60 * 1000
*/

function SyncService (options) {

    var SyncService = require('./sync/syncService.js');
    var UserRepository = require('./sync/userRepository.js');
    
    var ChunkFetcher = require('./chunkFetcher/chunkFetcher.js');
    var PostgresDbStore = require('./chunkFetcher/postgresdbStore.js');
    var UserTagInterceptor = require('./interceptor/userTagInterceptor.js');
    var https = require('https');
    var pg = require('pg').native;

    var ConnectedPostgresDbStore = function(){
        return new PostgresDbStore(options.dbConnectionString);
    };

    var USERS_LIVE_TABLE    = options.liveTable,
        USERS_WORKING_TABLE = options.workingTable,
        USERS_BACKUP_TABLE  = options.backupTable;

    var syncService = new SyncService(
        new UserRepository(options.dbConnectionString, USERS_LIVE_TABLE),
        new UserRepository(options.dbConnectionString, USERS_WORKING_TABLE),
        new UserRepository(options.dbConnectionString, USERS_BACKUP_TABLE));

    syncService.MAX_USER_COUNT = options.maxEntityCount;

    var PAGE_SIZE = options.pageSize,
        MAX_RUN_TIME_MS = options.maxRunTime;

    setTimeout(function () {
        console.log('reached maximum job uptime...going down.');
        // This is for safety. We don't won't multiple jobs to run at the same time.
        // In the worst case job A gets the resume point (e.g. 200 rep) at startup while
        // job B is just about to wipe out the data. Then job A would insert users with
        // rep < 200 AFTER job B already wiped the data. This would mean the sync would
        // be locked in < 200 rep land.
        // TODO: Figure out how to avoid multiple instances
        process.exit(0);
    }, MAX_RUN_TIME_MS);

    var rebuild = function(){
        new ChunkFetcher({
            url: 'http://api.stackexchange.com/2.2/users?order=desc&site=' + options.stackexchangeSite,
            key: 'items',
            pageSize: PAGE_SIZE,
            maxLength: 20000,
            interceptor: new UserTagInterceptor(new ConnectedPostgresDbStore(), options.stackexchangeSite),
            store: ConnectedPostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
        });
    };
    
    var safeResume = function(){
        syncService
            .isReadyForMigration()
            .then(function(isReady){
                if (isReady){
                    syncService
                        .migrate()
                        .then(function(){
                            resume();
                        });
                }
                else{
                    resume();
                }
            });
    };

    var resume = function(){
        pg.connect(options.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            client.query('SELECT "user"->\'reputation\' as reputation from users_working ORDER BY ("user"->>\'reputation\')::int LIMIT 1', function(err, result) {
                done();

                if (result.rows.length === 0){
                    rebuild();
                    return;
                }

                var reputation = result.rows[0].reputation;

                new ChunkFetcher({
                    url: 'http://api.stackoverflow.com/1.1/users?&max=' + reputation,
                    key: 'users',
                    pageSize: PAGE_SIZE,
                    maxLength: 20000,
                    interceptor: new UserTagInterceptor(new ConnectedPostgresDbStore()),
                    store: ConnectedPostgresDbStore
                })
                .fetch()
                .then(function(users){
                    console.log(users);
                });

                if(err) {
                    return console.error('error running query', err);
                }

            });
        });

    };

    return{
        resume: resume,
        safeResume: safeResume,
        rebuild: rebuild
    }
};

module.exports = SyncService;