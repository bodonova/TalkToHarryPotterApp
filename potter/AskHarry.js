'use strict';
/* eslint-env es6*/

var watson = require('watson-developer-cloud');
//var sleep = require('thread-sleep');

var harry_workspace_id =  process.env.WORKSPACE_ID || 'ac98ad6d-1dfd-4012-be01-4584d95b03aa';
/**
* Instantiate the Watson Conversation Service
*/
var conversation = new watson.ConversationV1({
  username: process.env.CONVERSATION_USERNAME || '163ecdf5-6197-401c-a2f4-819336362625',
  password: process.env.CONVERSATION_PASSWORD || 'GXyFOWHdMcR5',
  //version_date: watson.ConversationV1.VERSION_DATE_2017_01_26
  version_date: '2016-09-20', // change version if needed
  version: 'v1',
});

/**
* Calls the conversation message api.
* returns a promise
*/
var call_watson = function(text, response) {
  //console.log ("Asking: "+text+" and we will wait");
  var answer = 'No answer was given';
  var payload = {
    workspace_id: harry_workspace_id,
    input: {
      text: text
    },
    // context: context
  };

  var replyPromise =
  new Promise(function (resolve, reject) {conversation.message(payload, function(err, data) {
    if (err) {
      console.err('Error: '+err);
      reject(err);
    } else {
      if (data.output.text.length >0) {
        console.log ('got '+data.output.text.length+' answers: '+data.output.text[0]);
        answer = data.output.text[0];
        //console.log ('got JSON data with '+data.output.text.length+' text fields: '+answer);
      } else {
        answer = JSON.stringify(data);
        console.log ('Didn\'t get a good answer so sending '+answer);
        //console.log ('something else: '+answer);
      }
      resolve(answer);
    }
  })}
);
replyPromise.then(function(fulfilled){
  console.log ('fulfilled='+fulfilled);
  console.log("fulfilled: answer to \`"+text+"\' is: "+answer);
  if (null != response) {
    // TODO add proper response headers
    response.end (answer);
  }
}, function(error) {
  console.log("Reply for error:"+error.message);
  // TODO construct an error response
  response.end (error);
});

};
exports.message = call_watson;
// test messages
// var q = 'does harrys have any scars?';
// console.log ("Question: "+q+" Answer: "+message (q, null));
// var q = 'What is the the small golden ball called?';
// console.log ("Question: "+q+" Answer: "+message (q, null));
// var q = 'what does it mean to be pure blood?';
// console.log ("Question: "+q+" Answer: "+message (q, null));
//console.log ("Answer: "+message ('does harrys have any scars?', null));
// console.log ("Answer: "+message ('What is the the small golden ball called?', null));
// console.log ("Answer: "+message ('what does it mean to be pure blood?', null));
// console.log ("Answer: "+message ('what age is harry?', null));
// console.log ("Answer: "+message ('what is the name of the four houses?', null));

// An async call to Harry Potter chat service
function ask_harry (question, callback) {
  var responded = false;
  var responseText = 'No Answer';

  console.log ('Asking Harry: '+question);

  conversation.message({
    input: { text: question },
    workspace_id: harry_workspace_id
  }, function(err, response) {
    if (err) {
      console.error(err);
      callback(question, 'Harry had a problem getting the answer to your question: '+err);
    } else {
      console.log(JSON.stringify(response, null, 2));
      callback (question, response.output.text[0]);
    }
  });
}
exports.ask_harry = ask_harry;

// A debug callback to show what answer was got
function got_answer (question, answerText) {
  console.log ('The answer to your question \''+question+'\' is: \''+answerText);
}
exports.got_answer = got_answer;

// console.log ('test questions');
// ask_harry('does harrys have any scars?', got_answer);
// ask_harry('What is the the small golden ball called?', got_answer);
// ask_harry('what does it mean to be pure blood?', got_answer);
// ask_harry('what age is harry?', got_answer);
// ask_harry('what is the name of the four houses?', got_answer);

// conversation.message({
//   input: { text: 'What\'s the weather?' },
//   workspace_id: '<workspace id>'
//  }, function(err, response) {
//      if (err) {
//        console.error(err);
//      } else {
//        console.log(JSON.stringify(response, null, 2));
//      }
// });
