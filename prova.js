const {google} = require('googleapis');
var express = require('express');
var path = require('path');

const fs = require('fs');
const multer=require('multer');
const { title } = require('process');
const session = require('express-session')
const cookieParser = require('cookie-parser')


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
const oauth = require('oauth')

const { promisify } = require('util');

var cred = fs.readFileSync('./tweetcred.json');

var sec = JSON.parse(cred)

const TWITTER_CONSUMER_API_KEY = sec.web.API_KEY;
const TWITTER_CONSUMER_API_SECRET_KEY = sec.web.API_KEY_SECRET;

const COOKIE_SECRET = process.env.npm_config_cookie_secret || process.env.COOKIE_SECRET

console.log(TWITTER_CONSUMER_API_KEY, TWITTER_CONSUMER_API_SECRET_KEY);

const oauthConsumer = new oauth.OAuth(
    'https://twitter.com/oauth/request_token', 'https://twitter.com/oauth/access_token',
    TWITTER_CONSUMER_API_KEY,
    TWITTER_CONSUMER_API_SECRET_KEY,
    '1.0A', 'http://localhost:3000/twitter/callback', 'HMAC-SHA1'
);

app.use(cookieParser())
app.use(session({ secret: COOKIE_SECRET || 'secret'}))

var tw_auth = false;
var reqTok = '';
var reqTokS = '';

app.post('/twitter', (req, res) =>{
    if(!tw_auth)res.redirect('/twitter/authorize');
    else{
        console.log('HELLO TWEEEEET');
    }
});

app.get('/twitter/logout', logout)
  function logout (req, res, next) {
    res.clearCookie('twitter_screen_name')
    req.session.destroy(() => res.redirect('/'))
  }

app.get('/twitter/authenticate', twitter('authenticate'))
app.get('/twitter/authorize', twitter('authorize'))
function twitter(method = 'authorize') {
    return async (req, res) =>{
        const {oauthRequestToken, oauthRequestTokenSecret} = await getOAuthRequestToken()

        console.log(`/twitter/${method} ->`, { oauthRequestToken, oauthRequestTokenSecret })

        reqTok = oauthRequestToken;
        reqTokS = oauthRequestTokenSecret;

        const authorizationURL = `https://api.twitter.com/oauth/${method}?oauth_token=${oauthRequestToken}`
        console.log('redirecting user to ', authorizationURL);
        res.redirect(authorizationURL);
    }
}

app.get('/twitter/callback', async (req, res) =>{
    const {oauthRequestToken} = reqTok;
    const {oauthRequestTokenSecret} = reqTokS;

    const {oaut_verifier: oauthVerifier} = req.query;
    console.log('/twitter/callback', {oauthRequestToken, oauthRequestTokenSecret, oauthVerifier})

    const {oauthAccessToken, oauthAccessTokenSecret, results} = await getOAuthAccessTokenWith({ oauthRequestToken, oauthRequestTokenSecret, oauthVerifier})
    req.session.oauthAccessToken = oauthAccessToken;

    const {user_id: userId /*, screen_name */} = results;
    const user = oauthGetUserById(userId, {oauthAccessToken, oauthAccessTokenSecret});
    
    req.session.twitter_screen_name = user.screen_name;

    tw_auth = true;
    res.redirect ('/twitter');
})

app.listen(3000);



//FUNZIONI TWITTER
async function oauthGetUserById (userId, { oauthAccessToken, oauthAccessTokenSecret } = {}) {
    return promisify(oauthConsumer.get.bind(oauthConsumer))(`https://api.twitter.com/1.1/users/show.json?user_id=${userId}`, oauthAccessToken, oauthAccessTokenSecret)
      .then(body => JSON.parse(body))
  }

  async function getOAuthAccessTokenWith ({ oauthRequestToken, oauthRequestTokenSecret, oauthVerifier } = {}) {
    return new Promise((resolve, reject) => {
      oauthConsumer.getOAuthAccessToken(oauthRequestToken, oauthRequestTokenSecret, oauthVerifier, function (error, oauthAccessToken, oauthAccessTokenSecret, results) {
        return error
          ? reject(new Error('Error getting OAuth access token'))
          : resolve({ oauthAccessToken, oauthAccessTokenSecret, results })
      })
    })
  }

  async function getOAuthRequestToken () {
    return new Promise((resolve, reject) => {
      oauthConsumer.getOAuthRequestToken(function (error, oauthRequestToken, oauthRequestTokenSecret, results) {
        return error
          ? reject(new Error('Error getting OAuth request token'))
          : resolve({ oauthRequestToken, oauthRequestTokenSecret, results })
      })
    })
  }