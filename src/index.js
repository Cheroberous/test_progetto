const express = require('express');
const {google} = require('googleapis');
var request = require('request');
var path = require('path');
var app= express();
const fs = require('fs');
const multer=require('multer');
const { title } = require('process');
var cred = fs.readFileSync('./credenziali.json');
const server = require('http').createServer(app);
const WebSocket = require('ws');
const {Client} = require('pg');
const bodyParser = require('body-parser');
var quanti_tweet=13;
app.use(
    bodyParser.urlencoded({
      extended: false,
    })
  )
  
app.use(bodyParser.json());
// const winston = require('winston');



app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.set('view engine','ejs');
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
// const ws = new WebSocket.Server({ port: 9998 });
const wss = new WebSocket.Server({ server:server });


// const client = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'rdc',
//   // password: 'postgres',
//   password: 'postgres',
//   port: 5432
// });

var nome = "";


  wss.on('connection', function connection(ws) {

    console.log("new client connected");
    // ws.send("hello new client");
  
    ws.on('message', function incoming(message) {
       
      console.log('received_s: %s', message);
      ws.send("the message i receiver is"+message);
      
      console.log(nome);

      if(message=="query"){
        //try{
          //client.connect();
          //console.log("connected");
          // const query = "INSERT INTO utenti (id_utente) SELECT * FROM (SELECT $1) AS tmp WHERE NOT EXISTS (SELECT id_utente FROM utenti WHERE id_utente = $1) RETURNING *";
          // const value = [nome];
          // client
          //             .query(query, value)
          //             .then(res => {
          //                 console.log(res.rows[0])
                        
          //             })
          // }
          // catch(error){
          //   console.log(error);
          // }
        console.log(nome);
      }
    });
  
   
  
  });
///////////////////////////////////////////////////////////////////////////////////////////
const client_id = "363448232063-6gutecgr4r0me31qmib2sg9bspdabhvn.apps.googleusercontent.com";
const client_secret = "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";
const red_uri="http://localhost:3000/";

const oAuth2Client=new google.auth.OAuth2(
  client_id,
  client_secret,
  red_uri
);

app.get('/', (req, res) => {
  const environment = {
    title: 'Docker with Nginx and Express risposte da uno dei nodi',
    node: process.env.NODE_ENV,
    instance: process.env.INSTANCE,
    port: process.env.PORT
  };
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
else{
  res.redirect('/login');
}

});

var Storage=multer.diskStorage({
  destination: function(req,file,callback){
      callback(null,"./videos");
  },
  filename: function(req,file,callback){
      // callback(null,file.fieldname+"_"+Date.now()+"_"+file.originalname);
      callback(null,file.originalname);

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
          nome=response.data.name;
          // channel_id=response.data.id;
          

          res.render("home_youtube",{name:nome});
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


//var tcred = fs.readFileSync('/home/dario/Università/Reti/test_progetto/backend/tweetcred.json');
//var tsec = JSON.parse(tcred);

const consumer_key = "jClfAhpw7pUR8CzgJvIhldwAg";
const consumer_secret = "O12WKU3LtWeowd91nwEIuOtL7Hfz6sq0gubjDB7QsEvjhVi5aT";
const red_t_uri = "http://localhost:3000/twitter/callback";

var RequestToken = "";
var RequestSecret = "";
var AccessToken = "";
var AccessSecret = "";
var screen_name = "";


//console.log (tsec);

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


server.listen(process.env.PORT,()=>console.log("server in ascolto"));
//app.listen(3000);

// app.listen(process.env.PORT, () => {
//   // winston.info(`NODE_ENV: ${process.env.NODE_ENV}`);
//   // winston.info(`INSTANCE: ${process.env.INSTANCE}`);
//   // winston.info(`EXPRESS: ${process.env.PORT}`);
// });
