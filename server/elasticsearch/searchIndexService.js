var Q = require('q');
var stackWhoConfig = require('../common/config.js');
var elasticsearch = require('elasticsearch');
var pg = require('pg').native;

var esClient = elasticsearch.Client({
  hosts: [
    stackWhoConfig.elasticsearchEndpoint
  ]
}); 

var SearchIndexService = function(){

    var BATCH_SIZE = 200;

    var createIndex = function(searchOptions, fn){
        var deferred = Q.defer();

        var sql = 'SELECT * FROM users WHERE ("user"->>\'_ninya_io_synced\')::boolean is null LIMIT ' + BATCH_SIZE;

        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                deferred.reject(err);
                return;
            }
            client.query(sql, function(err, result) {
                done();

                if(err) {
                    return deferred.reject(err);
                }

                var tasks = result.rows.map(function(obj){
                    return esClient.index({
                        index: 'production',
                        type: 'user',
                        id: obj.user.user_id,
                        body: obj.user
                    });
                });

                Q.all(tasks)
                 .then(function(foo){
                    //mark batch as synced
                    Q.all(result.rows.map(function(obj){
                        var user = obj.user;
                        user._ninya_io_synced = true;
                        return client.query('UPDATE users SET "user" = $1 WHERE "user"->>\'user_id\' = \'' + user.user_id  + '\'', [user], function(err, result) {
                            if (err){
                                console.log(err);
                            }
                        });
                    }));
                 });

                deferred.resolve(result.rows);
            });
        });

        return deferred.promise;
    };

    return {
        createIndex: createIndex
    }
};

module.exports = SearchIndexService;