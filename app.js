var webserver = require('./backend/webserver/webserver'),
	logger = require('./backend/service/logger');

webserver.init().done(function() {
	logger.info('[app] Service initialized');
});