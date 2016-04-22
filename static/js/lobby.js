function start(){
  var request = new XMLHttpRequest();
  var self = this;
  request.onreadystatechange = function() {
  if (request.readyState == 4 && request.status == 200) {
      if(request.responseText==="false")
        alert("Superpowers are already running or you don't have superpowers?");
      else
        alert('Your superpowers have started at '+document.origin+'/superpower/'+uid+'/');
    }
  };
  request.open("POST", "start", true);
  request.send();
}

function stop(){
  var request = new XMLHttpRequest();
  var self = this;
  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      if(request.responseText==="false")
        alert("Your superpowers aren't running or something's wrong!");
      else
        alert("Superpowers stopped!");
    }
  };
  request.open("POST", "stop", true);
  request.send();
}

function settings(){
  document.location = '/settings';
}

function invite(){
  
}

function open(){
  document.location = '/superpower/'+uid;
}

function projects(){
  document.location = '/projects';
} 
