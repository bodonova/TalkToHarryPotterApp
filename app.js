/**
 * Copyright 2014, 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//'use strict';


var express = require('express'),
    app = express(),
	  bodyParser = require("body-parser"), //L.R.
    errorhandler = require('errorhandler'),
    bluemix = require('./config/bluemix'),
    watson = require('watson-developer-cloud'),
    //wconv = require ('./potter/node_modules/watson-developer-cloud/conversation/v1.js'),
    //ah = require ('./potter/AskHarry'),
    path = require('path'),
    // environmental variable points to demo's json config file
    extend = require('util')._extend;

// For local development, put username and password in config
// or store in your environment
var config = {
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: '7b997ab9-ea3f-433c-af73-55852c07468e',
  password: 'WltbTSiRn0UC'
};

// if bluemix credentials exists, then override local
var credentials = extend(config, bluemix.getServiceCreds('speech_to_text'));
var authorization = watson.authorization(credentials);

// redirect to https if the app is not running locally
if (!!process.env.VCAP_SERVICES) {
  app.enable('trust proxy');
  app.use (function (req, res, next) {
    if (req.secure) {
      next();
    }
    else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

// Setup static public directory
app.use(express.static(path.join(__dirname , './public')));

// Get token from Watson using your credentials
app.get('/token', function(req, res) {
  authorization.getToken({url: credentials.url}, function(err, token) {
    if (err) {
      console.log('error:', err);
      res.status(err.code);
    }
    res.send(token);
  });
});

// L.R.
// -------------------------------- TTS ---------------------------------
var tts_credentials = extend({
  url: 'https://stream.watsonplatform.net/text-to-speech/api',
  version: 'v1',
  username: 'cab8317b-130c-4e4e-ba83-f40090205f51',
  password: 'bATIAqAubS5h',
}, bluemix.getServiceCreds('text_to_speech'));

// Create the service wrappers
var textToSpeech = watson.text_to_speech(tts_credentials);

app.get('/synthesize', function(req, res) {
  var transcript = textToSpeech.synthesize(req.query);
  transcript.on('response', function(response) {
    if (req.query.download) {
      response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
    }
  });
  transcript.on('error', function(error) {
    console.log('Synthesize error: ', error)
  });
  transcript.pipe(res);
});

// -------------------------------- Conversation ---------------------------------


app.get('/api/conversation', function(req, response) {
  var harry_workspace_id =  process.env.WORKSPACE_ID || 'ac98ad6d-1dfd-4012-be01-4584d95b03aa';
  var conversation = new watson.ConversationV1({
    username: process.env.CONVERSATION_USERNAME || '163ecdf5-6197-401c-a2f4-819336362625',
    password: process.env.CONVERSATION_PASSWORD || 'GXyFOWHdMcR5',
    //version_date: watson.ConversationV1.VERSION_DATE_2017_01_26
    version_date: '2016-09-20', // change version if needed
    version: 'v1',
  });
  var text = req.query.question;
  console.log ('Called conversation with quewstion: '+text);

  var answer = 'No clear answer could be given';
  var payload = {
    workspace_id: harry_workspace_id,
    input: {
      text: text
    },
  };
  response.setHeader('Content-Type', 'text/plain')

  var replyPromise =
  new Promise(function (resolve, reject) {
    conversation.message(payload, function(err, data) {
      if (err) {
        console.log('Error: '+err);
        response.status(500);
        response.end ("The service failed with error "+err.message);
        //reject(err);
        resolve(err); // resolve because we already handled the error
      } else {
        response.status(200);
        if (data.output.text.length >0) {
          console.log ('got '+data.output.text.length+' answers: '+data.output.text[0]);
          answer = data.output.text[0];
          //console.log ('got JSON data with '+data.output.text.length+' text fields: '+answer);
        } else {
          // answer = JSON.stringify(data);
          answer = 'No clear answer could be given for your question: '+req.query.question;
          console.log ('Didn\'t get a good answer so sending '+answer);
          //console.log ('something else: '+answer);
        }
        // TODO add proper response headers
        response.end (answer);
        resolve(answer);
      }
    })
  });

});




// ----------------------------------------------------------------------

// Add error handling in dev
if (!process.env.VCAP_SERVICES) {
  app.use(errorhandler());
}
var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
