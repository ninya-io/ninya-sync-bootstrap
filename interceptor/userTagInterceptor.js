var Q = require('q');
var ChunkFetcher = require('../chunkFetcher/chunkFetcher.js');

var UserTagInterceptor = function(userStore){
   return function(users){

        if(users.length > 0){
            var lastUser = users[users.length - 1];

            return userStore
                .exists(lastUser.user_id)
                .then(function(exists){

                    if (exists){
                        console.log('chunk already exists...skipping');
                        return [];
                    }
                    else {
                        return Q.all(users.map(function(user){
                            return new ChunkFetcher({
                                url: 'http://api.stackexchange.com/2.2/users/' + user.user_id + '/top-answer-tags?site=' + options.stackexchangeSite,
                                key: 'items',
                                pageSize: 30,
                                maxLength: 30,
                                maxPage: 1,
                                waitAfterErrorMs: 1500
                            })
                            .fetch()
                            .then(function(userTags){
                                console.log('fetched ' + userTags.length + ' tags for user ' + user.user_id + ' at ' + new Date())
                                user.top_tags = userTags;
                                return user;
                            });
                      }));
                    }
                });

        }
        else {
            return Q.fcall(function(){
                return users
            });
        }

    }; 
}

module.exports = UserTagInterceptor;