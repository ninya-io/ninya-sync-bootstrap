var Q = require('q');

var HttpUtilitiesMock = function(){
    var self = {};

    self.queueManager = {};

    self.requestCount = 0;

    var failure = { message: null };

    self.reset = function(){
        self.queueManager = {};
    };

    self.addToResponseQueue = function(url, response){
        if(!self.queueManager[url]){
            self.queueManager[url] = {
                count: 0,
                queue: []
            }
        }

        self.queueManager[url].queue.push(response);
    };

    var getFromResponseQueue = function(url){
        if (!self.queueManager[url]){
            throw new Error("no mocked response");
        }

        var queueWrapper = self.queueManager[url];
        queueWrapper.count++;
        var response = queueWrapper.queue.pop();
        return response;
    };

    self.failWith = function(message){
        failure.message = message;
        return failure;
    };

    self.httpGetGzipedJson = function(url){
        self.requestCount++;

        var deferred = Q.defer();
        var response = getFromResponseQueue(url);

        if (response === failure){
            deferred.reject();
        }
        else{
            deferred.resolve(response);
        }

        return deferred.promise;
    };

    return self;
};


module.exports = HttpUtilitiesMock;