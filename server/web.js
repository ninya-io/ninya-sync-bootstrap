var express = require('express');
var app = express();
var https = require('https');
var api = require('./api.js')(app);

app.use(express.logger());

var pg = require('pg'); 

app.get('/state', function(request, response) {
    response.send('up');
});

var port = process.env.PORT || 5010;
app.listen(port, function() {
    console.log('Listening on ' + port);
});