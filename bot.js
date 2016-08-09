const botBuilder = require('claudia-bot-builder');
const co = require('co');
const coreq = require('co-request');
const each = require('co-each');

module.exports = botBuilder(request => {
	return co(function* () {
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
}