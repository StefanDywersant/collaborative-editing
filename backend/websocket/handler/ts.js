var q = require('q'),
	server = require('../server'),
	logger = require('../../service/logger');


/**
 * Timestamp message structure
 * @typedef {{id: string}} TSMessage
 */


/**
 * Message type name
 * @type {string}
 */
const MESSAGE_TYPE = 'ts';


/**
 * Timestamp message handler
 *
 * @param {ClientConnection} connection WebSocket connection instance
 * @param {TSMessage} message Timestamp message object
 */
var messageEH = function(connection, message) {
	connection.emit(
		MESSAGE_TYPE,
		{
			ts: Date.now(),
			id: message.id
		}
	);

	logger.silly('[handler.ts:messageEH][%s] Responded to id=%s', connection.id, message.id);
};


/**
 * Handles arrival of new WebSocket connection.
 *
 * @param {ClientConnection} connection WebSocket connection instance
 */
var connectionEH = function(connection) {
	connection.on('message', (type, message) => {
		if (type == MESSAGE_TYPE) {
			messageEH(connection, message);
		}
	});
};


/**
 * Initializes timestamp message handler.
 *
 * @returns {Promise.bool}
 */
var init = function() {
	server.on('connection', connectionEH);

	logger.info('[handler.ts:init] Initialized WebSocket timestamp message handler');

	return q(true);
};


// public interface
module.exports = {
	init: init
};