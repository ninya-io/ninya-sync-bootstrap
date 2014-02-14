var Q = require('q');
var stackWhoConfig = require('../common/config.js');
var pg = require('pg').native;

var PostgresDbStore = function(){
    var self = {};
    var data = [];
    var length = 0;
    var counter = 0;

    self.getAll = function(){
        return [];
    };

    self.getLength = function(){
        return length;
    };

    self.exists = function(id){
        var deferred = Q.defer();

        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            var QUERY = 'SELECT * from users_working WHERE "user"->>\'user_id\' = \'' + id  + '\'';

            client.query(QUERY, function(err, result) {
                done();

                if(err) {
                    console.error('error running query', err);
                    deferred.reject();
                    return;
                }

                var exists = result.rows.length > 0;

                deferred.resolve(exists);
            });
        });

        return deferred.promise;
    };

    self.append = function(chunk){
        length += chunk.length;

        chunk.forEach(function(entity){
            //connections are pooled. However, we should still investigate if it's the
            //right thing to call pg.connect inside the loop.
            pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
                if(err) {
                    return console.error('error fetching client from pool', err);
                }
                client.query('INSERT INTO users_working VALUES($1)', [entity], function(err, result) {
                    done();

                    counter++;
                    console.log(counter + '. entry written at' + new Date());

                    if(err) {
                        return console.error('error running query', err);
                    }
                });
            });
        });
    };

    return self;
};

module.exports = PostgresDbStore;