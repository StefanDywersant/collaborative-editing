var q = require('q'),
	webserver = require('./backend/webserver/server'),
	websocket = require('./backend/websocket/server'),
	logger = require('./backend/service/logger');

q.all([
	webserver.init(),
	websocket.init()
]).done(function() {
	logger.info('[app] Service initialized');
});