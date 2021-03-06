var q = require('q'),
	webserver = require('./backend/webserver/server'),
	websocket = require('./backend/websocket/server'),
	tsHandler = require('./backend/websocket/handler/ts'),
	stateHandler = require('./backend/websocket/handler/state'),
	logger = require('./backend/service/logger'),
	replManager = require('./backend/replication/manager');


q.all([
		webserver.init(),
		websocket.init(),
		tsHandler.init(),
		stateHandler.init(),
		replManager.init()
]).done(function() {
	logger.info('[app] Service initialized');
});