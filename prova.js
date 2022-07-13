const {google} = require('googleapis');
var express = require('express');
var path = require('path');

const fs = require('fs');
const multer=require('multer');
const { title } = require('process');

var cred = fs.readFileSync('./credenziali.json');

const app = express();


//npm install pg
const {Client} = require('pg');
const { response } = require('express');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'RDC',
    password: 'postgres',
    port: 5432
});
client.connect();


var sec = JSON.parse(cred);
console.log(sec);

// console.log(sec);
const client_id = sec.web.client_id;
const client_secret = sec.web.client_secret;
const red_uri=sec.web.redirect_uris[0];

app.set('view engine','ejs');

const oAuth2Client=new google.auth.OAuth2(
    client_id,
    client_secret,
    red_uri
);

var Storage=multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,"./videos");
    },
    filename: function(req,file,callback){
        callback(null,file.fieldname+"_"+Date.now()+"_"+file.originalname);
    },
})
var upload= multer({
    storage: Storage,
}).single("file");

var autenticato=false;
var scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

// app.get('/login', function(req, res){
//     res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar.events&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri="+red_uri+"&client_id="+client_id);
//   });


app.get('/',(req,res)=>{
    const code=req.query.code;
    if(code){
        oAuth2Client.getToken(code,function(err,tokens){
            if(err)throw err
            console.log("ti sei autenticato");
            oAuth2Client.setCredentials(tokens);
            autenticato=true;
            res.redirect('/home');
        })
    }
})


//variabile globale per username da cercare nel database
var nome = "";

app.get('/home', function(req, res){
    if(!autenticato){
        console.log("non autenticato");
        var url=oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope:scopes,
        });
        console.log(url);
        res.redirect(url);
        // res.render('index',{url:url});
    }
    else{
        console.log("utente autenticato, /home");

        var oauth2=google.oauth2({
            version:'v2',
            auth:oAuth2Client
        })
        oauth2.userinfo.get(function(err,response){
            if(err) throw err
            console.log(response.data);
            nome=response.data.name;

            res.render("index_a",{name:nome});

            const query = "INSERT INTO utenti (id_utente) SELECT * FROM (SELECT $1) AS tmp WHERE NOT EXISTS (SELECT id_utente FROM utenti WHERE id_utente = $1) RETURNING *"
            const value = [nome]
            
            //callback
            client.query(query, value, (err, res) => {
                if(err) {
                    console.log(err.stack)
                } else{
                console.log(res.rows[0]) //id_utente: name
                }
            });

            //promise
            client
                .query(query, value)
                .then(res => {
                    console.log(res.rows[0])
                    //{id_utente: name}
                })
                .catch(e => console.error(e.stack))
        })
    }
});



app.post('/upload',(req,res)=>{
    upload(req,res,function(err){
        if(err) throw err;
        console.log(req.file.path)
        // title=req.body.title

        const youtube =google.youtube({
            version: 'v3',
            auth: oAuth2Client
        })

        // call youtube api
        youtube.videos.insert(
            {
            resource:{
                snippet:{
                    title:"primo_video",
                    description:"descrizione video",
                    tags:"argomenti"
                },
                status:{
                    privacystatus:"public"
                },
            },
            part:"snippet,status",
            media:{
                 body:fs.createReadStream(req.file.path)
            }
            },
            (err,data) => {
                if(err) throw err
                console.log("uploading video");

            }
        )
    })
});


//TWITTER API
var tw_auth = false;

const oauth = require('oauth');
const { get } = require('request');

var request_token_url = 'https://api.twitter.com/oauth/request_token';
var access_token_url = 'https://api.twitter.com/oauth/access_token';
var authorize_url = 'https://api.twitter.com/oauth/authorize';


var tcred = fs.readFileSync('./tweetcred.json');
var tsec = JSON.parse(tcred);
const consumer_key = tsec.web.API_KEY;
const consumer_secret = tsec.web.API_KEY_SECRET;
const red_t_uri = tsec.web.redirect_uris[0];

var RequestToken = "";
var RequestSecret = "";
var AccessToken = "";
var AccessSecret = "";

console.log (tsec);

function consumer(){
    return new oauth.OAuth(
        request_token_url,
        access_token_url,
        consumer_key,
        consumer_secret,
        "1.0A",
        red_t_uri,
        "HMAC-SHA1"
    );
}

app.post('/twitter', (req, res) => {
  res.redirect('/twitter/connect');
  });

app.get('/twitter/connect', (req, res) => {
  if(!tw_auth){
    consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results) {
        if(error){
          res.send("Error getting OAuth request token:");
        } else {
          RequestToken = oauthToken;
          RequestSecret = oauthTokenSecret;
          res.redirect("https://twitter.com/oauth/authorize?oauth_token=" + oauthToken);
        }
      });
    }
    else {
      console.log("autenticato su twitter!");
      res.send('CIAO');
    }
})

app.get('/twitter/callback', (req, res) => {
  console.log(RequestToken);
  console.log(RequestSecret);
  console.log(req.query.oauth_verifier);

  consumer().getOAuthAccessToken(RequestToken, RequestSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(error){
          res.send("error getting OAuth access token");
      } else {
          AccessToken = oauthAccessToken;
          AccessSecret = oauthAccessTokenSecret;
      }    
  });

  tw_auth = true;
  res.redirect('/twitter/connect');
  
});

app.listen(3000);