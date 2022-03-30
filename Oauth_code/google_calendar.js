// https://developers.google.com/identity/protocols/OAuth2WebServer

var express = require('express');
var request = require('request');
var bodyParser = require("body-parser");

const fs = require('fs');

let rawdata = fs.readFileSync('./credential.json');  //prendo credenziali

let sec = JSON.parse(rawdata); //parses a JSON string, constructing the JavaScript value or object described by the string
console.log(sec);

// prendo le credenziali dal file parsato in json
client_id = sec.web.client_id;
client_secret = sec.web.client_secret;
red_uri=sec.web.redirect_uris[0];  // indirizzo al quale verrò reindirizzato topo autenticazione

var app = express();
var a_t = '';

app.use(bodyParser.urlencoded({ extended: false }));
/*-app.use(bp.json()) looks at requests where the Content-Type: application/json header is present
    and transforms the text-based JSON input into JS-accessible variables under req.body.
  -app.use(bp.urlencoded({extended: true}) does the same for URL-encoded requests.
    the extended: true precises that the req.body object will contain values of any type instead of just strings.
*/
// Non ho effettivamente capito a cosa serva "app.use(....);" 


/* vari scope per il calendar presi dalla documentazione

https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.events
*/

// STRUTTURA RICHIESTA OAUTH

/*"https://apitest.acme.com/oauth/authorize?
response_type=code
&client_id="xxx"
&redirect_uri=http://my-callback.com"*/ // la mia redirect uri è il localhost con path "/" quindii mi rimanda alla get successiva

app.get('/login', function(req, res){
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar.events&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri="+red_uri+"&client_id="+client_id);
});

app.get('/', function(req, res){
  console.log("code taken");
   //res.send('the access token is: ' + req.query.code);

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
    a_t = info.access_token;a_t = info.access_token;
  });

});

app.get('/use_token', function(req, res){
  var options = {
  url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList/',
  
  headers: {
    'Authorization': 'Bearer '+a_t
    //Bearer authentication is an HTTP authentication scheme that involves security tokens called bearer tokens
    }
  };
  request(options, function callback(error, response, body) {

  if (!error && response.statusCode == 200) {

    console.log("elenco calendari trovati come risposta alla richiesta");
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
