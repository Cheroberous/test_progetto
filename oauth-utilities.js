const oauth = require('oauth')
const fs = require('fs');
var path = require('path');

const { promisify } = require('util')

var cred = fs.readFileSync('./tweetcred.json');

var sec = JSON.parse(cred)


const TWITTER_CONSUMER_API_KEY = sec.web.API_KEY;
const TWITTER_CONSUMER_API_SECRET_KEY = sec.web.API_KEY_SECRET;

console.log(TWITTER_CONSUMER_API_KEY, TWITTER_CONSUMER_API_SECRET_KEY)

const oauthConsumer = new oauth.OAuth(
  'https://twitter.com/oauth/request_token', 'https://twitter.com/oauth/access_token',
  TWITTER_CONSUMER_API_KEY,
  TWITTER_CONSUMER_API_SECRET_KEY,
  '1.0A', 'http://127.0.0.1:3000/twitter/callback', 'HMAC-SHA1')
