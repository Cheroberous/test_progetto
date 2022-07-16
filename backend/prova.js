
// preso a_t devo chiedere il nome del canale o l'id e poi provare ad avere una lista dei video
const {google} = require('googleapis');
var express=require('express');
var request = require('request');
var path = require('path');
var app= express();
const fs = require('fs');
const multer=require('multer');
const { title } = require('process');
var cred = fs.readFileSync('./credenziali.json');
const WebSocket = require('ws');
//npm install pg
const {Client} = require('pg');
const bodyParser = require('body-parser');
var quanti_tweet=8;
app.use(
    bodyParser.urlencoded({
      extended: false,
    })
  )
  
app.use(bodyParser.json());


const lista = new Array();
class video {
	constructor(id,titolo,desc,data) { 
		this.videoId = id;
		this.title = titolo;
		this.description = desc;
		this.time = data;
	}
    Stampa_cont(){
        console.log( "video id == "+this.videoId + " video title == " + this.title+ " description == " + this.description + " published time == " + this.data);
}
	
	// get email() { return this._email; }
	
}
//////////////////////////////////////////////////////////////////////////////////////////
const ws = new WebSocket.Server({ port: 9998 });


const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rdc_1',
    // password: 'postgres',
    password: 'ciaodafrancesca',
    port: 5432
  });

  ws.on('connection', function connection(ws) {

    console.log("new client connected");
    // ws.send("hello new client");
  
  
    ws.on('message', function incoming(message) {
       
      console.log('received_s: %s', message);
      ws.send("the message i receiver is"+message);
  
      if(message=="connect"){
        client.connect();
  
      }
      if(message=="query"){
        client.connect();
        const query = "SELECT * FROM azioni "
        client
                    .query(query)
                    .then(res => {
                        console.log(res.rows[0])
                        
                    })
                    .catch(e => console.error(e.stack))
  
      }
    });
  
   
  
  });
///////////////////////////////////////////////////////////////////////////////////////////
var sec = JSON.parse(cred);
// console.log(sec);

// console.log(sec);
// const identificativo_canale="UCVuZe4vjCbQLCLLeXW2NH_Q";
// var channel_id;
// var a_t;
const client_id = sec.web.client_id;
const client_secret = sec.web.client_secret;
const red_uri=sec.web.redirect_uris[0];

app.set('view engine','ejs');

const oAuth2Client=new google.auth.OAuth2(
    client_id,
    client_secret,
    red_uri
);
// console.log("questo è il contenuto dopo google.auth.oauth");
// console.log(oAuth2Client);
/*access_token: 
    refresh_token: 
    scope: 
    token_type: 'Bearer',
    id_token:*/

// praticamente sposta il file nella cartella ./videos
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
}).single("file");  //file.fieldname


var autenticato=false;
var scopes = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube.readonly";


app.get('/login',function(req,res){

    res.render("pagina_0");


})
app.get('/home', function(req, res){
    if(!autenticato){
        // console.log("non autenticato");
        var url=oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope:scopes,
        });
        //url = genera l'url per avere il token con gli scope richiesti
        // console.log("oauth2client.generateurl");
        // console.log(url);
        res.redirect(url);
        // res.render('index',{url:url});
    }
    else{
        console.log("utente autenticato, /home");

        var oauth2=google.oauth2({
            version:'v2',
            auth:oAuth2Client
        })
        
        // console.log("oauth2Client\n");
        // console.log(oAuth2Client);
       
        var prova=oAuth2Client.credentials;
        // console.log("dovrei aver preso access token ecc");
        // console.log(prova);
        a_t=prova.access_token;
        //unico campo rilevante di oauth2
        oauth2.userinfo.get(function(err,response){
            if(err) throw err
            // console.log(response.data);
            var name=response.data.name;
            // channel_id=response.data.id;
            

            res.render("home_youtube",{name:name});
        })
        

    }
});
//&key=AIzaSyAwlCGZ0GWGuB6pUgSsSvqbMVUQRlEMMDU
    


app.get('/videos',(req,res,body)=>{

    console.log("sono dentro /videos e voglio chiamare fnz\n");
    // console.log(oAuth2Client);

    const youtube_1 =google.youtube({
        version: 'v3',
        auth: oAuth2Client
    })

    youtube_1.search.list({

        "part":[
            "snippet"
        ],
        "forMine": true,
        "type": [
          "video"
        ]

    })
    .then(function(response) {
        // Handle the results here (response.result has the parsed body).
        console.log("stampa la risposta del server\n\n");
        //console.log("Response", response);
        var vid=response.data.items;
        console.log("da qui lista video??");
        //console.log(vid);
        
        // console.log("quanti video (lunghezza l) ",l);
        var i=0;
        for (const v of vid) {
            
            var video_item = new video(v.id.videoId,v.snippet.title,v.snippet.description,v.snippet.publishedAt);
            video_item.Stampa_cont();
            lista.push(video_item);
            
          }
          console.log(lista);
        

        res.render("lista_video",{lista:lista});
        // res.render('index',{url:url});
      
    
        console.log("\n\nfine elenco\n\n");
      },
      function(err) { console.error("Execute error", err); },);



})
app.post('/prova',(req,res)=>{
    console.log(req.body);
})
app.post('/delete',(req,res)=>{

    
    console.log("\nsono dentro /delete e voglio chiamare fnz\n");
    
   
    console.log(req.body);

    // var b=res.json({requestBody: req.body.title_v})
    // console.log(b)

    var id_video=req.body.identif_video;
    console.log(id_video);


    const youtube_d =google.youtube({
        version: 'v3',
        auth: oAuth2Client
    })

    youtube_d.videos.delete({

        "id": id_video

    })
    .then(function(response) {
        // Handle the results here (response.result has the parsed body).
        // console.log("Response", response);
        console.log("\n\nfine cancellazione\n\n");
      },
      function(err) { console.error("Execute error", err); });    
})

app.post('/upload',(req,res)=>{
    //metto il file in videos e chiamo callback fnz
    upload(req,res,function(err){
        if(err) throw err;
        console.log(req.file.path);
        var title=req.body.title;
        var description = req.body.description;
        var tags = req.body.tags;
        // console.log("questo è il contenuto di google.auth.oauth dopo upload");
        // console.log(oAuth2Client);
        const youtube =google.youtube({
            version: 'v3',
            auth: oAuth2Client
        })
        console.log("youtube in upload");
        // console.log(youtube);

        // chiamo youtube api
        youtube.videos.insert(
            {
            resource:{
                snippet:{
                    title:title,
                    description:description,
                    tags:tags
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
                // res.render

            }
            
        )
        // .then(function(response) {
        
        //     console.log("video caricato ", response);
        //     res.render("home_youtube");
        //   },
        //   function(err) { console.error("Execute error", err); });
        
    })
    res.render("home_youtube");
})


app.get('/upload_form',(req,res)=>{
    res.render('index_a');
  })

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


/////////                                     DA QUI TWITTER 

var tw_auth = false;
var utente_ver=0;
const oauth = require('oauth');
// const got = require('got');
// const  get = require('request');
// const  request = require('http');
var Twit = require('twit');

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
var screen_name = "";


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
    if(utente_ver){
        res.render('twitter');
    }
    else{
        utente_ver=1;
  res.redirect('/twitter/connect');}
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
    }
})
app.get('/twitter/callback', (req, res) => {
  console.log("Request token: " + RequestToken);
  console.log("Request Secret: " + RequestSecret);
  console.log(req.query.oauth_verifier);

  consumer().getOAuthAccessToken(RequestToken, RequestSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(error){
          res.send("error getting OAuth access token");
      } else {
          AccessToken = oauthAccessToken;
          AccessSecret = oauthAccessTokenSecret;
          console.log(results);

          screen_name = results.screen_name;
          
          res.render("twitter",{name:screen_name});
          
      }    
  });
  tw_auth = true;
  // res.redirect('/twitter/connect');
});




app.post('/tweet', (req, res) => {
  quanti_tweet=quanti_tweet+1;
  var quale="Hello world"+"_"+quanti_tweet;
  const endpointURL = 'https://api.twitter.com/1.1/statuses/update.json';
 
  var T = new Twit({
    consumer_key: consumer_key,
    consumer_secret: consumer_secret,
    access_token: AccessToken,
    access_token_secret: AccessSecret
  });
  console.log("\n\n");
  console.log(req.body);
  console.log(req.body.tweet_testo);
  T.post(endpointURL, {status: quale}, function(err, data, response) {
    console.log(data);
  })
  res.render("home_youtube");
  
});


app.get('/rimando',(req,res)=>{
    res.render('twitter');
})

app.listen(3000,()=>console.log("server is listening on 3000"));











/*
per trovare id 

GET https://youtube.googleapis.com/youtube/v3/channels?part=localizations&part=contentOwnerDetails&part=status&part=contentDetails&part=snippet&part=topicDetails&mine=true&key=[YOUR_API_KEY] HTTP/1.1

Authorization: Bearer [YOUR_ACCESS_TOKEN]
Accept: application/json
*/
/*
GET https://youtube.googleapis.com/youtube/v3/search?part=snippet&forMine=true&order=date&type=video&videoType=any&key=[YOUR_API_KEY] HTTP/1.1

Authorization: Bearer [YOUR_ACCESS_TOKEN]
Accept: application/json

*/
