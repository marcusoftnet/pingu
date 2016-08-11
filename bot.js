const botBuilder = require('claudia-bot-builder');
const co = require('co');
const coreq = require('co-request');
const aws = require('aws-sdk');
const lambda = new aws.Lambda();

const api = botBuilder((message, apiRequest) => {

  return new Promise(
    (resolve, reject) => {
      lambda.invoke({
        FunctionName: apiRequest.lambdaContext.functionName,
        Qualifier: apiRequest.lambdaContext.functionVersion,
        InvocationType: 'Event',
        Payload: JSON.stringify({ slackEvent: message })
      },
      (err, done) => {
        if (err) return reject(err);
        resolve(done);
      });
  })
  .then(() => {
    const noOfUrls = urlsFromSlackMessage(message).length;

    return {
      text: `Hold on. I'm pinging ${noOfUrls} urls`
    }
  })
  .catch(() => {
    return `Ok, something went seriously wrong...`
  });
});


const slackDelayedReply = botBuilder.slackDelayedReply;

api.intercept((event) => {
  if (!event.slackEvent) return event;

  const message = event.slackEvent; //original slack message sent to bot
  const urls = urlsFromSlackMessage(message);

  var pingResults = [];
  for (const i = 0; i < urls.length; i++) {
    pingResults.push(pingUrl(urls[i]))
  }

  return slackDelayedReply(message, {
    "response_type": "ephemeral",
    "text": `Ping results for '${message}':`,
    "attachments": JSON.stringify(pingResults)
  })
  .then(() => false); // prevents normal execution
});

function urlsFromSlackMessage(message){
  return message.text.split(',');
};

function pingUrl(url) {
    return co(function*() {
      const start = new Date();
      const result = yield coreq(url);
      const end = new Date() - start;

      return `${url} - ${end} ms`;
    })
    .catch(function(err) {
      return `Could not ping ${url} '${err.message}'`;
    });
};

module.exports = api;
