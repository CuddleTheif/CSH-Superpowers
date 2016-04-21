var server = require('http').createServer(),
               express = require('express'),
               app = express(),
               port = 80,
               startPort = 8000,
               cp = require('child_process'),
               bodyParser = require('body-parser'),
               fs = require('fs');
var app = express();
var superpowers = {};
var portsUsed = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('static'));

// Page for the player's superpower options
app.get('/', function(req, res) {
  res.render('lobby');
});

// Post for starting the server of the given uuid
app.post('/start', function(req, res) {
  
  var uuid = req.body.uuid;
  if(!superpowers[uuid]){

    // Set current server to loading
    superpowers[uuid] = {loading:true};

    // First get a free port
    setImmediate(function(){
      getFreePort(startPort, function(port){
        superpowers[uuid].port = port;
        portsUsed.push(port);

        // Next, set the port numbers in the config file
        fs.readFile('./powers/'+uuid+'/config.json', function(err, data) {
          if(err) throw err;
          var newData = JSON.parse(data);
          newData.mainPort = superpowers[uuid].port;
          newData.buildPort = superpowers[uuid].port+1;
          fs.writeFile('./powers/'+uuid+'/config.json', JSON.stringify(newData), function(err) {
            if(err) throw err;

            // Now run the server and set loading to false
            var powerDir = '../powers/'+uuid+'/';
            superpowers[uuid].process = cp.exec('sudo node server start --data-path='+powerDir+' > '+powerDir+'server.log', {cwd: './app/'});
            superpowers[uuid].loading = false;

         });
	});
        
      });
    });
    res.send(true);
  }
  else
    res.send(false);

});

// Post for stoping the server of the given uuid
app.post('/stop', function(req, res) {
  var uuid = req.body.uuid;
  if(superpowers[uuid]){
    portsUsed.splice(portsUsed.indexOf(superpowers[uuid].port), 1);
    killTask(superpowers[uuid].port);
    superpowers[uuid] = null;
    res.send(true);
  }
  else
    res.send(false);

});

// Redirect urls for user's superpowers
app.get(/\/superpower\/[^\/]+?\/?$/, function(req, res) {
  console.log(req.headers.host);
  var uuid = req.url.match(/^.*\/(.+?)\/?$/)[1].toLowerCase().replace(/ /g, '_');
  if(superpowers[uuid]){
    if(superpowers[uuid].loading)
      res.render('loading', {uuid: uuid});
    else
      res.redirect('https://'+req.headers.host+':'+superpowers[uuid].port);
  }
  else
    res.render('super404', {uuid: uuid});
});

// Gets the next free port
function getFreePort(port, callback){
  if(portsUsed.indexOf(port)==-1)
     callback(port);
  else
    setImmediate(function() { getFreePort(port+2, callback); });
}

// Make sure all sub servers close before this server does
process.on('SIGINT', function() { process.exit(); } );
process.on('SIGTERM', function() { process.exit(); } );
process.on('exit', function(code){
  for(var i=0;i<portsUsed.length;i++)
    killTask(portsUsed[i]);
});

// Kill the taks at the given port
function killTask(port){
  cp.exec('sudo kill $(sudo lsof -t -i:'+port+')');
}

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
