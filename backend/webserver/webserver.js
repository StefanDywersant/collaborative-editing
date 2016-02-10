'use strict';

var http = require('http'),
	q = require('q'),
	express = require('express'),
	config = require('config'),
	logger = require('../service/logger'),
	winstonRequestLogger = require('winston-request-logger');

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
var instance = http.createServer(app);


/**
 * Initializes webserver instance.
 *
 * @returns {Promise.Boolean}
 */
var init = function() {
	instance.listen(config.webserver.port, config.webserver.host);
	logger.info('[webserver:init] Webserver listening on %s:%d', config.webserver.host, config.webserver.port);
	return q(true);
};

module.exports = {
	init: init
};