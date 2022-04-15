// https://developers.google.com/identity/protocols/OAuth2WebServer

var express = require('express');
var request = require('request');
var bodyParser = require("body-parser");

const fs = require('fs');

let rawdata = fs.readFileSync('./client_secret_363448232063-6gutecgr4r0me31qmib2sg9bspdabhvn.apps.googleusercontent.com.json');  //prendo credenziali

let sec = JSON.parse(rawdata); //parses a JSON string, constructing the JavaScript value or object described by the string
console.log(sec);


client_id = sec.web.client_id;
client_secret = sec.web.client_secret;
red_uri=sec.web.redirect_uris[0];  

var app = express();
var a_t = '';


app.get('/login', function(req, res){
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/youtube&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri="+red_uri+"&client_id="+client_id);
});

app.get('/', function(req, res){

  console.log("code taken");
   //code perchè in login ho chiesto response type=code

  var formData = {
    code: req.query.code,
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: red_uri,
    grant_type: 'authorization_code'
  }

  request.post({url:'https://www.googleapis.com/oauth2/v4/token', form: formData}, function optionalCallback(err, httpResponse, body) {
    
    if (err) {
    return console.error('upload failed:', err);
    }
    console.log('Upload successful! Server responded with:', body);
    var info = JSON.parse(body);
    res.send("Got the token che è == "+ info.access_token);
    a_t = info.access_token;    // salvato come global var
  });

});

app.get('/use_token', function(req, res){
  var options = {
  url: 'https://www.googleapis.com//youtube/v3/channels?part=localizations&part=contentOwnerDetails&part=status&part=contentDetails&part=snippet&part=topicDetails&forUsername=Synergo',  
                                                        
  
   headers: {
     'Authorization': 'Bearer '+a_t,
     'Accept' : 'application/josn'
     
     }
   };
  request(options, function callback(error, response, body) {

  if (!error && response.statusCode == 200) {

    console.log("elenco risorse trovate");
    var info = JSON.parse(body);
    res.send(info);
    //console.log(info);
    console.log("fine invio ");

    }

  else {
    console.log("problema richiesta eventi");
    console.log(error);
    //console.log(response.statusCode());
  }
  });

});

app.listen(3000);

//https://youtube.googleapis.com/youtube/v3/channels?part=localizations&part=contentOwnerDetails&part=status&part=contentDetails&part=snippet&part=topicDetails&id=UCYFgn8_JgaQL1E-N2tg1xcQ
//https://developers.google.com/youtube/v3/docs/channels/list?apix_params=%7B%22part%22%3A%5B%22localizations%22%2C%22contentOwnerDetails%22%2C%22status%22%2C%22contentDetails%22%2C%22snippet%22%2C%22topicDetails%22%5D%2C%22id%22%3A%5B%22UCYFgn8_JgaQL1E-N2tg1xcQ%22%5D%7D


