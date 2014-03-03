var Q = require('q');

var MockUserRepository = function(name){
    var self = {},
        users = [];
    
    self.getName = function(){
        return name;
    };

    self.getAll = function(){
        return Q.fcall(function(){
            return users;
        });
    };

    self.add = function(user){
        users.push(user);
    };

    self.addFrom = function(otherRepository){
        return otherRepository
                    .getAll()
                    .then(function(data){
                        users = users.concat(data);
                    });
    };

    self.clear = function(){
        return Q.fcall(function(){
            users.length = 0;
        });
    };

    self.getCount = function(){
        return Q.fcall(function(){
            return users.length;
        });
    };

    return self;
};

module.exports = MockUserRepository;