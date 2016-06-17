const botBuilder = require('claudia-bot-builder');
const co = require('co');
const coreq = require('co-request');

module.exports = botBuilder(request => {
    var url = request.text;

    return co(function*() {
        var start = new Date();
	    var result = yield coreq(url);
    	var end = new Date() - start;

        return `Pinged ${url} successfully - took ${end} ms`;
    }).catch(function(err) {
		return `Could not ping ${url} (${err.message})`;
    });
});