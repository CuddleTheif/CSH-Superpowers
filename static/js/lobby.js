document.getElementById("start-button").onclick = function(){
  var request = new XMLHttpRequest();
  var self = this;
  request.onreadystatechange = function() {
  if (request.readyState == 4 && request.status == 200) {
      if(request.responseText==="false")
        alert("Superpowers are already running or you don't have superpowers?");
      else
        alert('Your superpowers has started!');
    }
  };
  request.open("POST", "start", true);
  request.send();
}

document.getElementById("stop-button").onclick = function(){
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

document.getElementById("settings-button").onclick = function(){
  document.location = '/settings';
}

document.getElementById("invite-button").onclick = function(){
   prompt("Send this link to your friends!", document.origin+'/superpower/'+uid+'/');
}

document.getElementById("open-button").onclick = function(){
  document.location = '/superpower/'+uid;
}

document.getElementById("projects-button").onclick = function(){
  document.location = '/projects';
}
