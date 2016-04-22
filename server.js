var server = require('http').createServer(),
               express = require('express'),
               session = require('express-session'),
               app = express(),
               port = 80,
               startPort = 8000,
               cp = require('child_process'),
               bodyParser = require('body-parser'),
               fs = require('fs'),
               ldap = require('ldapjs'),
               Zip = require('easy-zip').EasyZip;
var app = express();
var superpowers = {};
var portsUsed = [];
var sessionStatus = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(session({secret: ">AQ#5kb4lk';,QV-.VC5=V,8C-"}));

// Page for the player's superpower options
app.get('/', function(req, res) {
  
  // Check if there is some on logged in
  if(sessionStatus[req.sessionID]==1){
    
    // Make sure they have a dir for their superpowers
    fs.exists('./powers/'+req.session.uid+'/', function(exists){
      if(!exists){
        fs.mkdir('./powers/'+req.session.uid+'/', function(err){
          if(err) throw err;
          var config = {password: "temp", maxRecentBuilds: 10};
          fs.writeFile('./powers/'+req.session.uid+'/config.json', JSON.stringify(config), function(err) {
            if(err) throw err;
          });
          fs.mkdir('./powers/'+req.session.uid+'/projects/', function(err){
            if(err) throw err;
          });
        });
      }
    });

    // Show them the lobby
    res.render('lobby', {uid: req.session.uid});
  }
  else{
    var sStatus = sessionStatus[req.sessionID]!=null;
    sessionStatus[req.sessionID] = null;
    res.render('login', {failed: sStatus});
  }

});

// Post for attempting to log in
app.post('/login', function(req, res) {
  
  
  if(sessionStatus[req.sessionID]==1 || sessionStatus[req.sessionID]==-1)
    res.send(true);
  else if(sessionStatus[req.sessionID]==null){
    req.session.login = -1;
    var client = ldap.createClient({ url: 'ldap://ldap.csh.rit.edu' });
    sessionStatus[req.sessionID] = 0;
    req.session.uid = req.body.uid;
    client.bind('uid='+req.body.uid+',ou=Users,dc=csh,dc=rit,dc=edu', req.body.password, function(err) { 
       if(!err){
         req.session.uid = req.body.uid;
         sessionStatus[req.sessionID] = 1;
       }
       else
         sessionStatus[req.sessionID] = -1;
    });
    res.render('logging');
  }
  else
    res.send(false);

});

// Post for logging out
app.get('/logout', function(req, res){
  req.session.uid = null;
  sessionStatus[req.sessionID] = null;
  res.redirect('/');
});

// Post for starting the server of the session's uid
app.post('/start', function(req, res) {
  
  var uid = req.session.uid;

  if(!uid){
    res.send(false);
    return;
  }

  if(!superpowers[uid]){

    // Set current server to empty
    superpowers[uid] = {};

    // First get a free port
    setImmediate(function(){
      getFreePort(startPort, function(port){
        superpowers[uid].port = port;
        portsUsed.push(port);

        // Next, set the port numbers in the config file
        fs.readFile('./powers/'+uid+'/config.json', function(err, data) {
          if(err) throw err;
          var newData = JSON.parse(data);
          newData.mainPort = superpowers[uid].port;
          newData.buildPort = superpowers[uid].port+1;
          fs.writeFile('./powers/'+uid+'/config.json', JSON.stringify(newData), function(err) {
            if(err) throw err;

            // Now run the server and set loading to false
            var powerDir = '../powers/'+uid+'/';
            cp.exec('sudo node server start --data-path='+powerDir+' > '+powerDir+'server.log', {cwd: './app/'});

         });
	});
        
      });
    });
    res.send(true);
  }
  else
    res.send(false);

});

// Post for stoping the server of the session's uid
app.post('/stop', function(req, res) {
  var uid = req.session.uid;
  
  if(!uid){
    res.send(false);
    return;
  }

  if(superpowers[uid]){
    portsUsed.splice(portsUsed.indexOf(superpowers[uid].port), 1);
    killTask(superpowers[uid].port);
    superpowers[uid] = null;
    res.send(true);
  }
  else
    res.send(false);

});

// Allow the user to mess with their files
app.get('/projects', function(req, res) {
  var uid = req.session.uid;

  if(!uid){
    res.redirect('/');
    return;
  }

  var dir = './powers/'+uid+'/projects/';
  fs.readdir(dir, function(err, files) {
    if(err) throw err;
    var names = [];
    for(var i=0, counter=0;i<files.length;i++){
      var getCurName = (function(i) { return function(name){
        names[i] = name;
        if(++counter>=files.length)
          res.render('projects', {projects: files, names: names});
      };})(i);
      getProjectName(dir+files[i], getCurName);
    }
  });
  
});

// Gets the project name of the given project
function getProjectName(dir, callback){
  fs.readFile(dir+'/manifest.json', function(err, data){
    if(err) throw err;
    var mainfest = JSON.parse(data);
    callback(mainfest.name);
  });
}

// Gets the current settings and allows changing them
app.get('/settings', function(req, res) {
  fs.readFile('./powers/'+req.session.uid+'/config.json', function(err, data){
    if(err) throw err;
    res.render('settings', JSON.parse(data));
  });
});
app.post('/settings', function(req, res) {
  fs.readFile('./powers/'+req.session.uid+'/config.json', function(err, data){
    if(err) throw err;
    var config = JSON.parse(data);
    config.password = req.body.password;
    config.maxRecentBuilds = parseInt(req.body.maxRecentBuilds);
    fs.writeFile('./powers/'+req.session.uid+'/config.json', JSON.stringify(config), function(err){
      if(err) throw err;
    });
  });
  res.redirect('/');
});

// Handle downloading projects
app.get(/\/projects\/download\/[^\/]+?\/?$/, function(req, res) {
  
  if(!req.session.uid){
    res.redirect('/');
    return;
  }
  var filename = req.url.match(/^.*\/(.+?)\/?$/)[1];
  res.setHeader('Content-disposition', 'attachment; filename=' + filename+'.zip');
  var zip = new Zip();
  zip.zipFolder('./powers/'+req.session.uid+'/projects/'+filename, function(){
    var data = zip.generate({base64:false,compression:'DEFLATE'});
    res.end(data, 'binary');
  }, {rootFolder: filename});

});

// Redirect urls for user's superpowers
app.get(/\/superpower\/[^\/]+?\/?$/, function(req, res) {
  
  if(!req.session.uid){
    res.redirect('/');
    return;
  }

  var uid = req.url.match(/^.*\/(.+?)\/?$/)[1].toLowerCase().replace(/ /g, '_');
  if(superpowers[uid]){
    if(superpowers[uid].loading)
      res.render('loading', {uid: uid});
    else
      res.redirect('http://'+req.headers.host+':'+superpowers[uid].port);
  }
  else
    res.render('super404', {uid: uid});
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
