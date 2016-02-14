var webserver = require('../webserver/server'),
	logger = require('../service/logger'),
	WebSocketServer = require('websocket').server,
	q = require('q'),
	config = require('config');


/**
 * Client connection interface for external usage
 * @typedef {{emit: function(string, object):Promise, id: string, on: function(string, function(string, object))}} ClientConnection
 */


/**
 * Dictionary which maps event name to array of handlers
 * @type {object<string, function[]>}
 */
var handlers = {};


/**
 * Returns connection identifier.
 *
 * @param {WebSocketConnection} wsConnection WebSocket connection object
 * @returns {string}
 */
var wsConnectionId = function(wsConnection) {
	return `${wsConnection.remoteAddress}${wsConnection.socket.remotePort ? (':' + wsConnection.socket.remotePort) : ''}`;
};


/**
 * Returns function which is to be called on WebSocket connection close.
 *
 * @param {WebSocketConnection} wsConnection WebSocket connection object
 * @returns {function(number, string)}
 */
var closeEH = function(wsConnection) {
	return (reasonCode, description) =>
		logger.verbose(
			'[websocket:closeEH][%s] Client disconnected: %s (%s)',
			wsConnectionId(wsConnection),
			description,
			reasonCode
		);
};


/**
 *
 * @param {WebSocketConnection} wsConnection WebSocket connection object
 * @returns {function({utf8Data: string})}
 */
var messageEH = function(wsConnection) {
	return (envelope) =>
		logger.silly('[websocket.server:messageEH][%s] %s', wsConnectionId(wsConnection), envelope.utf8Data);
};


/**
 * Creates external connection instance based on WebSocket connection.
 *
 * @param {WebSocketConnection} wsConnection WebSocket connection instance
 * @returns {ClientConnection}
 */
var createConnection = function(wsConnection) {
	var id = wsConnectionId(wsConnection);

	return {
		id: id,
		emit: (type, message) => {
			return q.ninvoke(wsConnection, 'sendUTF', JSON.stringify({type, message}));
		},
		on: (event, handler) => {
			switch(event) {
				case 'message':
					wsConnection.on('message', (data) => {
						var envelope = JSON.parse(data.utf8Data);
						logger.silly('[websocket.server:connection][%s] Received %s', id, data.utf8Data);
						handler(envelope.type, envelope.message);
					});
					break;

				case 'close':
					wsConnection.on('close', handler);
					break;
			}
		}
	};
};


/**
 * Called on WebSocket connection request. Binds connection events to proper handlers.
 *
 * @param {WebSocketRequest} request WebSocket request object
 */
var requestEH = function(request) {
	var wsConnection = request.accept('endpoint', request.origin),
		connection = createConnection(wsConnection);

	logger.verbose('[websocket.server:requestEH][%s] Client connected', connection.id);

	if ('connection' in handlers)
		handlers['connection'].forEach((handler) => handler(connection));

	wsConnection.on('close', closeEH(wsConnection));
	wsConnection.on('message', messageEH(wsConnection));
};


/**
 * Registers handler for certain events.
 * Available event types: message, open, close.
 *
 * @param {string} type Event type
 * @param {function} handler Event handler
 */
var on = function(type, handler) {
	if (type in handlers) {
		handlers[type].push(handler);
	} else {
		handlers[type] = [handler];
	}
};


/**
 * Initialized WebSocket server.
 *
 * @returns {Promise.bool}
 */
var init = function() {
	var server = new WebSocketServer(
		Object.assign(
			{httpServer: webserver.instance()},
			config.websocket.server
		)
	);

	server.on('request', requestEH);

	logger.info('[websocket.server:init] Initialized WebSockets server');

	return q(true);
};


module.exports = {
	init: init,
	on: on
};