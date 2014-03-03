var SyncService = require('../sync/syncService.js');
var MockUserRepository = require('./mockUserRepository.js');
var Q = require('q');

var assert = require('assert');

describe('SyncService', function(){
  describe('getWorkingRepository', function(){
    it('should return the live table', function(done){

        var liveUserRepository = new MockUserRepository('users');
        var workingUserRepository = new MockUserRepository('users_working');
        var backupUserRepository = new MockUserRepository('users_backup');

        liveUserRepository.add('testuser');

        var service = new SyncService(liveUserRepository, workingUserRepository, backupUserRepository);
        service
            .getWorkingRepository()
            .then(function(workingRepository){
                assert.equal(liveUserRepository, workingRepository);
                done();
            });

    });
  });
});

describe('SyncService', function(){
  describe('getActiveTable', function(){
    it('should return the working table', function(done){

        var liveUserRepository = new MockUserRepository('users');
        var workingUserRepository = new MockUserRepository('users_working');
        var backupUserRepository = new MockUserRepository('users_backup');

        liveUserRepository.add('testuser');

        var service = new SyncService(liveUserRepository, workingUserRepository, backupUserRepository);
        service.MAX_USER_COUNT = 1;
        
        service
            .getWorkingRepository()
            .then(function(workingRepository){
                assert.equal(workingUserRepository, workingRepository);
                done();
            });
    });
  });
});

describe('SyncService', function(){
  describe('isReadyForMigration', function(){
    it('should return true', function(done){

        var liveUserRepository = new MockUserRepository('users');
        var workingUserRepository = new MockUserRepository('users_working');
        var backupUserRepository = new MockUserRepository('users_backup');

        workingUserRepository.add('testuser');

        var service = new SyncService(liveUserRepository, workingUserRepository, backupUserRepository);
        service.MAX_USER_COUNT = 1;
        
        service
            .isReadyForMigration()
            .then(function(isReady){
                assert.equal(true, isReady);
                done();
            });
    });
  });
});

describe('SyncService', function(){
  describe('isReadyForMigration', function(){
    it('should return true', function(done){

        var liveUserRepository = new MockUserRepository('users');
        var workingUserRepository = new MockUserRepository('users_working');
        var backupUserRepository = new MockUserRepository('users_backup');

        var service = new SyncService(liveUserRepository, workingUserRepository, backupUserRepository);
        service.MAX_USER_COUNT = 1;
        
        service
            .isReadyForMigration()
            .then(function(isReady){
                assert.equal(false, isReady);
                done();
            });
    });
  });
});

describe('SyncService', function(){
  describe('migrate', function(){
    it('should shift the data', function(done){

        var liveUserRepository = new MockUserRepository('users');

        liveUserRepository.add('1');

        var workingUserRepository = new MockUserRepository('users_working');
        var backupUserRepository = new MockUserRepository('users_backup');

        workingUserRepository.add('1');
        workingUserRepository.add('2');
        workingUserRepository.add('3');

        var service = new SyncService(liveUserRepository, workingUserRepository, backupUserRepository);

        service
            .migrate()
            .then(function(){
                Q.all([
                    liveUserRepository.getCount(),
                    workingUserRepository.getCount(),
                    backupUserRepository.getCount()
                ])
                .spread(function(liveCount, workingCount, backupCount){
                    assert.equal(3, liveCount);
                    assert.equal(0, workingCount);
                    assert.equal(1, backupCount);

                    done();
                });
            });
    });
  });
});
