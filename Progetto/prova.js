const {google} = require('googleapis');
var express=require('express');
var path = require('path');
var app= express();
const fs = require('fs');
const multer=require('multer');
const { title } = require('process');
var cred = fs.readFileSync('./credenziali.json');

//npm install pg
const {Client} = require('pg');
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
            var name=response.data.name;

            res.render("index_a",{name:name});
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


app.listen(3000);