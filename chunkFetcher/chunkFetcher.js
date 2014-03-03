var InMemoryStore = require('./inMemoryStore.js');
var globals = require('../globals.js');
var Q = require('q');

var ChunkFetcher = function(options){

  var httpUtilities = globals.httpUtilities;

  var MAX_ERROR_COUNT = options.maxErrorCount || 20;

  var onMaxErrorReached = options.onMaxErrorReached || function(){
    process.exit(1);
  };

  var page = 1,
  errorTimeout = null,
  errorCount = 0,
  hold = false;
  
  options.store = options.store || InMemoryStore;
  var store = new options.store();

  var fetch = function(deferred){
    
    //we want to resolve a promise when all the data behind a given
    //command is fetched. Since we have to fetch the data in chunks,
    //this method is recursively called. It's essentialy that recursive
    //calls pass in the promise that was created when the fetch operation
    //was initiated.
    
    //So when a new fetch operation starts, we call the method without
    //passing a parameter in and create a new one here.
    if (!deferred){
      deferred = Q.defer();
    }
    
    if (hold){
      return;
    }
    
    httpUtilities
      .httpGetGzipedJson(options.url + '&pagesize=' + options.pageSize + '&page=' + page)
      .then(function(response){

        console.log('fetched: ' + options.key + ' at ' + new Date());
        console.log(response);
        var chunk = response[options.key];
        var initialChunkLength = chunk.length;
        
        var proceed = function(){
          store.append(chunk);
          page++;

          if (initialChunkLength === 0 || (page >= options.maxPage) || (options.maxLength && store.getLength() >= options.maxLength)){
            deferred.resolve(store.getAll());
          }
          else {
            fetch(deferred);
          }
        };
        
        if (options.interceptor){
          options.interceptor(chunk)
            .then(function(transformedChunk){
              chunk = transformedChunk;
              proceed();
            }, function(){
              throw new Error('intercepting failed');
            });
        }
        else{
          proceed();
        }
      })
      .fail(function(error){

        errorCount++;
        if (errorCount > MAX_ERROR_COUNT){
          onMaxErrorReached();
        }

        var remainingTries = MAX_ERROR_COUNT - errorCount;
        console.log('error while fetching ' + options.key );
        console.log(remainingTries + ' remaining tries');
        
        
        //it might happen that some requests fail (SO seems to throttle our requests if
        //we exceed a certain limit). So in case a request fails, we will just wait for
        //N seconds and then continue.
        if (errorTimeout){
          clearTimeout(errorTimeout);
        }
        errorTimeout = setTimeout(function(){
          console.log('retrying fetching ' + options.key);
          fetch(deferred);
        }, options.waitAfterErrorMs || 5000);
      });

      return deferred.promise;
  };
  
  var setHold = function(){
    hold = true;
  };
  
  var isPaused = function(){
    return hold;
  };
  
  var resume = function(){
    hold = false;
    return fetch();
  };
  
  var reset = function(){
    store = new options.store();
    page = 1;
    hold = false;
  };
  
  return {
    fetch: fetch,
    hold: setHold,
    reset: reset,
    resume: resume,
    isPaused: isPaused,
    store: store
  };
};

module.exports = ChunkFetcher;