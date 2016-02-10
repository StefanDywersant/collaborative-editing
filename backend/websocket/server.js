var webserver = require('../webserver/server'),
	logger = require('../service/logger'),
	WebSocketServer = require('websocket').server,
	q = require('q'),
	config = require('config');


/**
 * Returns connection identifier.
 *
 * @param {Object} connection WebSocket connection object
 * @returns {String}
 */
var connectionId = function(connection) {
	return `${connection.remoteAddress}${connection.socket.remotePort ? (':' + connection.socket.remotePort) : ''}`;
};


/**
 * Returns function which is to be called on WebSocket connection close.
 *
 * @param {Object} connection WebSocket connection object
 * @returns {Function}
 */
var closeHandler = function(connection) {
	return (reasonCode, description) =>
		logger.verbose(
			'[websocket:closeHandler][%s] Client disconnected: %s (%s)',
			connectionId(connection),
			description,
			reasonCode
		);
};


/**
 * Called on WebSocket connection request. Binds connection events to proper handlers.
 *
 * @param {Object} request
 */
var requestHandler = function(request) {
	var connection = request.accept('endpoint', request.origin);

	logger.verbose('[websocket:requestHandler][%s] Client connected', connectionId(connection));

	connection.on('close', closeHandler(connection));

};


/**
 * Initialized websocket server.
 *
 * @returns {Promise.Boolean}
 */
var init = function() {
	// create WebSockets server
	var server = new WebSocketServer(
		Object.assign(
			{httpServer: webserver.instance()},
			config.websocket.server
		)
	);

	server.on('request', requestHandler);

	logger.info('[websocket:init] Initialized websockets server');

	return q(true);
};


module.exports = {
	init: init
};