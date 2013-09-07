module.exports = function(app) {

    var stackWhoConfig = require('./common/config.js');
    
    var ChunkFetcher = require('./chunkFetcher/chunkFetcher.js');
    var PostgresDbStore = require('./chunkFetcher/postgresdbStore.js');
    var userTagInterceptor = require('./interceptor/userTagInterceptor.js');
    var https = require('https');
    var pg = require('pg').native;

    var rebuild = function(){
        new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 100,
            maxLength: 20000,
            interceptor: userTagInterceptor,
            store: PostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
        });
    };
    
    var resume = function(){
        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            client.query('SELECT "user"->\'reputation\' as reputation from users ORDER BY ("user"->>\'reputation\')::int LIMIT 1', function(err, result) {
                done();

                if (result.rows.length === 0){
                    rebuild();
                    return;
                }

                var reputation = result.rows[0].reputation;

                new ChunkFetcher({
                    url: 'http://api.stackoverflow.com/1.1/users?&max=' + reputation,
                    key: 'users',
                    pageSize: 100,
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

    resume();
};