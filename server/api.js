module.exports = function(app) {

    var stackWhoConfig = require('./common/config.js');

    var SyncService = require('./sync/syncService.js');
    var UserRepository = require('./sync/userRepository.js');
    
    var ChunkFetcher = require('./chunkFetcher/chunkFetcher.js');
    var PostgresDbStore = require('./chunkFetcher/postgresdbStore.js');
    var userTagInterceptor = require('./interceptor/userTagInterceptor.js');
    var https = require('https');
    var pg = require('pg').native;

    var USERS_LIVE_TABLE    = 'users',
        USERS_WORKING_TABLE = 'users_working',
        USERS_BACKUP_TABLE  = 'users_backup';

    var syncService = new SyncService(
        new UserRepository(USERS_LIVE_TABLE), 
        new UserRepository(USERS_WORKING_TABLE), 
        new UserRepository(USERS_BACKUP_TABLE));

    syncService.MAX_USER_COUNT = 148000;

    var PAGE_SIZE = 10,
        MAX_RUN_TIME_MS = 9 * 60 * 1000;

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
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: PAGE_SIZE,
            maxLength: 20000,
            interceptor: userTagInterceptor,
            store: PostgresDbStore
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
        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
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
                    interceptor: userTagInterceptor,
                    store: PostgresDbStore
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

    safeResume();
};