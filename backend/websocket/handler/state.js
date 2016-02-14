var q = require('q'),
	server = require('../server'),
	logger = require('../../service/logger'),
	formStates = require('../../form/states'),
	formConnections = require('../../form/connections');


/**
 * Holds single form's state with creation timestamp.
 * @typedef {{form: string, state: number, ts: number}} FormState
 */


/**
 * State message structure
 * @typedef {FormState} StateMessage
 */


/**
 * Message type name (inbound)
 * @type {string}
 */
const MESSAGE_TYPE = 'state';


/**
 * Form state message handler
 *
 * @param {ClientConnection} connection WebSocket connection instance
 * @param {StateMessage} message Form state message object
 */
var messageEH = function(connection, message) {
	formConnections.upsert(message.form, connection);
	formStates.update(message, connection);
};


/**
 * Connection close event handler.
 *
 * @param {ClientConnection} connection WebSocket connection instance
 */
var closeEH = function(connection) {
	formConnections.detach(connection);
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

	connection.on('close', () => {
		closeEH(connection);
	});
};


/**
 * Initializes form state message handler.
 *
 * @returns {Promise.bool}
 */
var init = function() {
	server.on('connection', connectionEH);

	logger.info('[handler.state:init] Initialized WebSocket form state message handler');

	return q(true);
};


// public interface
module.exports = {
	init: init
};