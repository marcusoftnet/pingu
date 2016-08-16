const botBuilder = require('claudia-bot-builder');
const co = require('co');
const coreq = require('co-request');
const each = require('co-each');
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
  return co(function *() {
    if (!event.slackEvent) return event;

    const message = event.slackEvent; //original slack message sent to bot
    const urls = urlsFromSlackMessage(message);

    var pingResults = yield each(urls, pingUrl);
    var attachments = yield each(pingResults, pingResultToSlackAttachement);

    return slackDelayedReply(message, {
      response_type: "ephemeral",
      text: `Ping results for '${pingResults.length}':`,
      attachments: attachments
    })
    .then(() => false); // prevents normal execution
  });
});

function urlsFromSlackMessage(message){
  return message.text.split(',');
};

function pingResultToSlackAttachement(url){
  return { text : url };
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
