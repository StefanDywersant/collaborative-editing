var config = require('config'),
	q = require('q'),
	formStates = require('../form/states'),
	WebSocketClient = require('../websocket/client'),
	replConnections = require('./connections');


/**
 * Form state message name
 * @type {string}
 */
const MESSAGE_TYPE = 'state';


/**
 * Handles form state message coming through replica pipe.
 *
 * @param {FormState} message
 * @param {ClientConnection} connection Replica connection instance
 */
var messageEH = function(message, connection) {
	formStates.update(message, connection);
};


/**
 * Sends local form states after getting replica connection.
 *
 * @param {ClientConnection} connection Replica connection instance
 */
var openEH = function(connection) {
	formStates.all().forEach((formState) => {
		connection.emit(MESSAGE_TYPE, formState);
	});
};


/**
 * Sets up single replica connection.
 *
 * @param {string} host Replica hostname
 * @param {string} port Replica port
 */
var connect = function(host, port) {
	var websocketClient = new WebSocketClient(host, port),
		connection = websocketClient.connection();

	replConnections.push(connection);

	websocketClient.on('message', (type, message) => {
		if (type == MESSAGE_TYPE) {
			messageEH(message, connection);
		}
	});

	websocketClient.on('open', () => openEH(connection));
};


/**
 * Initializes replication manager.
 *
 * @returns {Promise.bool}
 */
var init = function() {
	config.websocket.client.connections.forEach((connectionConfig) => {
		connect(connectionConfig.host, connectionConfig.port);
	});

	return q(true);
};


// public interface
module.exports = {
	init: init
};