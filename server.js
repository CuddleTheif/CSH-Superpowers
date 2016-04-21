var server = require('http').createServer(),
		express = require('express'),
		app = express(),
		port = 80,
		cp = require('child_process');
var app = express();
var superpowers = {};

app.set('view engine', 'ejs');
app.use(express.static('static'));

// Page for the player's superpower options
app.get('/', function(req, res) {
    res.render('lobby');
});

// Redirect urls for user's superpowers
app.get(/\/superpower\/[^\/]+?\/?$/, function(req, res) {
  var uuid = req.url.match(/^.*\/(.+?)\/?$/)[1].toLowerCase().replace(/ /g, '_');
  if(superpowers[name]){
    
  }
  else{
    
  }

});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
