'use strict';

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
        Payload: JSON.stringify({
          slackEvent: message
        })
      },
      (err, done) => {
        if (err) return reject(err);
          resolve(done);
        }
      );
  }).then(() => {
    const noOfUrls = message.text.split(',').length;

    return {
      text: `Wait a sec. I'm pinging ${noOfUrls} urls`
    }
  }).catch(() => {
    return `Ok, something went wrong...`
  });
});

module.exports = botBuilder(request => {
    return co(function*() {
        var urls = request.text.split(',');
        var messages = yield each(urls, pingUrl)
        return messages.join('\n');
    });
});

function pingUrl(url) {
    return co(function*() {
        var start = new Date();
        var result = yield coreq(url);
        var end = new Date() - start;

        return `${url} - ${end} ms`;
    }).catch(function(err) {
        return `Could not ping ${url} (${err.message})`;
    });
};

module.exports = api;
