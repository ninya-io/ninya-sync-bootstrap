var ChunkFetcher = require('../chunkFetcher/chunkFetcher.js');
var HttpUtilitiesMock = require('./httpUtilitiesMock.js');
var UserTagInterceptor = require('../interceptor/userTagInterceptor.js');
var Q = require('q');

var globals = require('../globals.js');

//var assert = require('assert');
var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

chai.Assertion.includeStack = true;

var httpUtilities = globals.httpUtilities = new HttpUtilitiesMock();

// the postgresDbStoreMock shares the exact same semantics of the HttpUtiltiesMock
// so we just alias the method in question and use that one :)
var postgresDbStoreMock = new HttpUtilitiesMock();
postgresDbStoreMock.exists = postgresDbStoreMock.httpGetGzipedJson;

describe('ChunkFetcher', function(){
  describe('fetch', function(){
    it('should fetch until there is no more data', function(done){

        httpUtilities.reset();

        var LAST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=2';
        //last request, reached the end
        httpUtilities.addToResponseQueue(LAST_API_URL, {
            users: []
        });

        var FIRST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=1';
        //first request
        httpUtilities.addToResponseQueue(FIRST_API_URL, {
            users: [{user_id: 1}]
        });

        var FIRST_USER_TAG_URL = 'http://api.stackoverflow.com/1.1/users/1/top-answer-tags?&pagesize=30&page=1'

        httpUtilities.addToResponseQueue(FIRST_USER_TAG_URL, {
            top_tags: ['foo']
        });

        //the user does not already exists
        postgresDbStoreMock.addToResponseQueue(1, false);

        var chunkFetcher = new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 10,
            maxLength: 20000,
            interceptor: new UserTagInterceptor(postgresDbStoreMock),
            //store: PostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
            assert.equal(users[0].user_id, 1);
            assert.equal(users.length, 1);
            //assert both endpoints where hit once
            assert.equal(httpUtilities.queueManager[FIRST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[LAST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[FIRST_USER_TAG_URL].count, 1);
            done();
        });

    });
  });
});

describe('ChunkFetcher', function(){
  describe('fetch', function(){
    it('should not fetch user tags because user already exists', function(done){

        httpUtilities.reset();

        var LAST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=2';
        //last request, reached the end
        httpUtilities.addToResponseQueue(LAST_API_URL, {
            users: []
        });

        var FIRST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=1';
        //first request
        httpUtilities.addToResponseQueue(FIRST_API_URL, {
            users: [{user_id: 1}]
        });

        var FIRST_USER_TAG_URL = 'http://api.stackoverflow.com/1.1/users/1/top-answer-tags?&pagesize=30&page=1'

        httpUtilities.addToResponseQueue(FIRST_USER_TAG_URL, {
            top_tags: ['foo']
        });

        //the user already exists
        postgresDbStoreMock.addToResponseQueue(1, true);

        var chunkFetcher = new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 10,
            maxLength: 20000,
            interceptor: new UserTagInterceptor(postgresDbStoreMock),
            //store: PostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
            //assert both endpoints where hit once
            assert.equal(httpUtilities.queueManager[FIRST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[LAST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[FIRST_USER_TAG_URL].count, 0, 'no extra tag fetching request');
            done();
        });

    });
  });
});

describe('ChunkFetcher', function(){
  describe('fetch', function(){
    it('should pause on exceptions, then resume', function(done){

        httpUtilities.reset();

        var LAST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=2';
        //last request, reached the end
        httpUtilities.addToResponseQueue(LAST_API_URL, {
            users: []
        });

        //second request
        httpUtilities.addToResponseQueue(LAST_API_URL, httpUtilities.failWith('timeout'));

        var FIRST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=1';
        //first request
        httpUtilities.addToResponseQueue(FIRST_API_URL, {
            users: [{user_id: 1}]
        });

        var chunkFetcher = new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 10,
            maxLength: 20000,
            waitAfterErrorMs: 100
            //interceptor: userTagInterceptor,
            //store: PostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
            assert.equal(users[0].user_id, 1);
            assert.equal(users.length, 1);
            assert.equal(httpUtilities.queueManager[FIRST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[LAST_API_URL].count, 2);
            done();
        });

    });
  });
});

describe('ChunkFetcher', function(){
  describe('fetch', function(){
    it('should not cause multiple user loading requests if tag loading fails', function(done){

        httpUtilities.reset();

        var LAST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=2';
        //last request, reached the end
        httpUtilities.addToResponseQueue(LAST_API_URL, {
            users: []
        });

        //second request
        httpUtilities.addToResponseQueue(LAST_API_URL, httpUtilities.failWith('timeout'));

        var FIRST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=1';
        //first request
        httpUtilities.addToResponseQueue(FIRST_API_URL, {
            users: [{user_id: 1}]
        });

        var LAST_USER_TAG_URL = 'http://api.stackoverflow.com/1.1/users/1/top-answer-tags?&pagesize=30&page=1'

        httpUtilities.addToResponseQueue(LAST_USER_TAG_URL, {
            top_tags: ['foo']
        });

        httpUtilities.addToResponseQueue(LAST_USER_TAG_URL, httpUtilities.failWith('timeout'));

        //the user does not already exists
        postgresDbStoreMock.addToResponseQueue(1, false);

        var chunkFetcher = new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 10,
            maxLength: 20000,
            waitAfterErrorMs: 100,
            interceptor: new UserTagInterceptor(postgresDbStoreMock)
            //store: PostgresDbStore
        })
        .fetch()
        .then(function(users){
            console.log(users);
            assert.equal(users[0].user_id, 1);
            assert.equal(users.length, 1);
            assert.equal(httpUtilities.queueManager[FIRST_API_URL].count, 1);
            assert.equal(httpUtilities.queueManager[LAST_API_URL].count, 2);
            assert.equal(httpUtilities.queueManager[LAST_USER_TAG_URL].count, 2, 'makes two tag requests');
            
            done();
        });

    });
  });
});

describe('ChunkFetcher', function(){
  describe('fetch', function(){
    it('should exit after hitting max error count', function(done){

        httpUtilities.reset();

        var LAST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=2';
        //last request, reached the end
        httpUtilities.addToResponseQueue(LAST_API_URL, {
            users: []
        });

        //third request
        httpUtilities.addToResponseQueue(LAST_API_URL, httpUtilities.failWith('timeout'));

        //second request
        httpUtilities.addToResponseQueue(LAST_API_URL, httpUtilities.failWith('timeout'));

        var FIRST_API_URL = 'http://api.stackoverflow.com/1.1/users?&pagesize=10&page=1';
        //first request
        httpUtilities.addToResponseQueue(FIRST_API_URL, {
            users: [{user_id: 1}]
        });

        var chunkFetcher = new ChunkFetcher({
            url: 'http://api.stackoverflow.com/1.1/users?',
            key: 'users',
            pageSize: 10,
            maxLength: 20000,
            waitAfterErrorMs: 100,
            maxErrorCount: 1,
            onMaxErrorReached: function(){
                assert.equal(httpUtilities.queueManager[FIRST_API_URL].count, 1);
                assert.equal(httpUtilities.queueManager[LAST_API_URL].count, 2);
                done();
            }
            //interceptor: userTagInterceptor,
            //store: PostgresDbStore
        })
        .fetch()
        .then();

    });
  });
});