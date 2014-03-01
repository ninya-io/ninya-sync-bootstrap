var SearchIndexService = require('./searchIndexService.js');
var searchIndexService = new SearchIndexService();
searchIndexService
    .createIndex()
    .finally(function(){
        console.log('ElasticSearchSync: shutting down')
        process.exit(0);
    });

setTimeout(function(){
    // we want a maximum up time of 50 minutes because we schedule heroku
    // to run this every hour.
    process.exit(0);
}, 50 * 60 * 1000)