var Q = require('q');
var pg = require('pg').native;
var stackWhoConfig = require('../common/config.js');

var UserRepository = function(name){
    var self = {},
        users = [];
    
    self.getName = function(){
        return name;
    };

    self.getAll = function(){
        throw new Error('Not implement');
    };

    self.add = function(user){
        throw new Error('Not implemented');
    };

    self.addFrom = function(otherRepository){

        var deferred = Q.defer();

        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            var ADD_FROM_QUERY = 'INSERT INTO ' + self.getName() + ' SELECT * FROM ' + otherRepository.getName();

            client.query(ADD_FROM_QUERY, function(err, result) {
                done();

                if(err) {
                    console.error('error running query', err);
                    deferred.reject();
                    return;
                }

                deferred.resolve();
            });
        });

        return deferred.promise;
    };

    self.clear = function(){

        var deferred = Q.defer();

        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            var DELETE_QUERY = 'DELETE FROM ' + self.getName();

            client.query(DELETE_QUERY, function(err, result) {
                done();

                if(err) {
                    console.error('error running query', err);
                    deferred.reject();
                    return;
                }

                deferred.resolve();
            });
        });

        return deferred.promise;
    };

    self.getCount = function(){
        var deferred = Q.defer();

        pg.connect(stackWhoConfig.dbConnectionString, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }

            var COUNT_QUERY = 'SELECT COUNT(*) AS user_count FROM ' + self.getName();

            client.query(COUNT_QUERY, function(err, result) {
                done();

                if(err) {
                    console.error('error running query', err);
                    deferred.reject();
                    return;
                }

                var userCount = result.rows[0].user_count;

                deferred.resolve(userCount);
            });
        });

        return deferred.promise;
    };

    return self;
};

module.exports = UserRepository;