var Q = require('q');

var SyncService = function(liveUserRepository, workingUserRepository, backupUserRepository){
    var self = {};
    
    self.MAX_USER_COUNT = 100;

    self.getWorkingRepository = function(){
        var deferred = Q.defer();

        liveUserRepository
            .getCount()
            .then(function(count){

                if(count >= self.MAX_USER_COUNT){
                    deferred.resolve(workingUserRepository);
                }
                else{
                    deferred.resolve(liveUserRepository);
                }
            });

        return deferred.promise;
    };

    self.isReadyForMigration = function(){
        var deferred = Q.defer();

        workingUserRepository
            .getCount()
            .then(function(count){
                if(count >= self.MAX_USER_COUNT){
                    console.log('ready for migration');
                    deferred.resolve(true);
                }
                else{
                    console.log('NOT ready for migration');
                    deferred.resolve(false);
                }
            });

        return deferred.promise;
    };

    self.migrate = function(){
        console.log('Migrating....');
        return backupUserRepository
                .clear()
                .then(backupUserRepository.addFrom.bind(null,liveUserRepository))
                .then(liveUserRepository.clear)
                .then(liveUserRepository.addFrom.bind(null, workingUserRepository))
                .then(workingUserRepository.clear);
    };

    return self;
};

module.exports = SyncService;