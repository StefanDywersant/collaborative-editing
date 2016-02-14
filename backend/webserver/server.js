var http = require('http'),
	q = require('q'),
	express = require('express'),
	config = require('config'),
	logger = require('../service/logger'),
	winstonRequestLogger = require('winston-request-logger');


var _instance;


// Configuration of webserver instance
{
	var app = express();

	// attach requests logger
	app.use(winstonRequestLogger.create(logger, {
		ip: ':ip',
		status: ':statusCode',
		method: ':method',
		url: ':url[pathname]',
		responseTime: ':responseTimems',
		message: '[webserver:static]'
	}));

	// serve static content from frontend/ directory
	app.use('/', express.static(__dirname + '/../../frontend/'));

	// create configured webserver instance
	_instance = http.createServer(app);
}


/**
 * Initializes webserver instance.
 *
 * @returns {Promise.bool}
 */
var init = function() {
	_instance.listen(config.webserver.port, config.webserver.host);
	logger.info('[webserver:init] Webserver listening on %s:%d', config.webserver.host, config.webserver.port);
	return q(true);
};


/**
 * Returns configured webserver instance
 *
 * @returns {object}
 */
var instance = () => _instance;


module.exports = {
	init: init,
	instance: instance
};