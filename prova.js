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


//npm install got@11.8.3 oauth-1.0a crypto 
const qs = require('querystring');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const got = require('got');
var request = require('request');

var tcred = fs.readFileSync('./tweetcred.json');
var tsec = JSON.parse(tcred);
console.log(tsec);

const consumer_key = tsec.web.API_KEY;
const consumer_secret = tsec.web.API_KEY_SECRET;

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
async function input(prompt) {
    return new Promise(async (resolve, reject) => {
      readline.question(prompt, (out) => {
        readline.close();
        resolve(out);
      });
    });
}  

const data = {
    "text": "hello"
};

const endpointURL = `https://api.twitter.com/2/tweets`;

// this example uses PIN-based OAuth to authorize the user
const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const oauth = OAuth({
    consumer: {
      key: consumer_key,
      secret: consumer_secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

async function requestToken() {
    const authHeader = oauth.toHeader(oauth.authorize({
      url: requestTokenURL,
      method: 'POST'
    }));
  
    const req = await got.post(requestTokenURL, {
      headers: {
        Authorization: authHeader["Authorization"]
      }
    });
    if (req.body) {
      return qs.parse(req.body);
    } else {
      throw new Error('Cannot get an OAuth request token');
    }
}

async function accessToken({
    oauth_token,
    oauth_token_secret
  }, verifier) {
    const authHeader = oauth.toHeader(oauth.authorize({
      url: accessTokenURL,
      method: 'POST'
    }));
    const path = `https://api.twitter.com/oauth/access_token?oauth_verifier=${verifier}&oauth_token=${oauth_token}`
    const req = await got.post(path, {
      headers: {
        Authorization: authHeader["Authorization"]
      }
    });
    if (req.body) {
      return qs.parse(req.body);
    } else {
      throw new Error('Cannot get an OAuth request token');
    }
}
async function getRequest({
    oauth_token,
    oauth_token_secret
  }) {
  
    const token = {
      key: oauth_token,
      secret: oauth_token_secret
    };
  
    const authHeader = oauth.toHeader(oauth.authorize({
      url: endpointURL,
      method: 'POST'
    }, token));
  
    const req = await got.post(endpointURL, {
      json: data,
      responseType: 'json',
      headers: {
        Authorization: authHeader["Authorization"],
        'user-agent': "v2CreateTweetJS",
        'content-type': "application/json",
        'accept': "application/json"
      }
    });
    if (req.body) {
      return req.body;
    } else {
      throw new Error('Unsuccessful request');
    }
}
  

app.post('/twitter', async(req, res) => {
    while(!tw_auth){
        //get Request token
        const oAuthRequestToken = await requestToken();

        //Get authorization
        authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
        res.redirect(authorizeURL.href);

        const pin = await input('Paste pin here: ');

        //Get access token
        const oAuthAccessToken = await accessToken(oAuthRequestToken, pin.trim());

        //Make the request
        const response = await getRequest(oAuthAccessToken);
        console.dir(response, {
            depth: null
        });

        tw_auth = true;    
    }
    console.log('hello');
});


app.listen(3000);