var progressBar = document.getElementById("progress");
var fileInput = document.getElementById("project-file");
var importForm = document.getElementById("import-form");

function upload(){

  if (fileInput.files.length==0){
    alert('Please choose 1 file!');
    return;
  }
  if(fileInput.files[0].type!=='application/x-zip-compressed'){
    alert('Please choose a zip file!');
    return;
  }

  var request = new XMLHttpRequest();
  request.upload.onprogress = function(event){
    progressBar.value = Math.round((event.loaded / event.total) * parseInt(progressBar.max));
  };
  request.onload = function(){
    if(request.status == 200){
      if(request.responseText)
        alert(request.responseText);
      else
        document.location.reload();
    }
    else
      alert("File upload failed!");
  };

  progressBar.value = 0;
  request.open('POST', 'import', true);
  request.send(new FormData(importForm));
}
