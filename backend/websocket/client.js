var W3CWebSocket = require('websocket').w3cwebsocket,
	logger = require('../service/logger'),
	q = require('q'),
	config = require('config');


/**
 * Envelope enclosing message and it's type
 * @typedef {{type: string, message: object}} Envelope
 */


/**
 * WebSocket readyState open constant
 * @type {number}
 */
const WS_RS_OPEN = 1;


module.exports = function(host, port) {


	/**
	 * Registered message handlers
	 * @type {{open: function[], close: function[], message: function(string, object)[]}}
	 */
	var handlers = {open: [], close: [], message: []};


	/**
	 * WebSocket instance
	 * @type {W3CWebSocket}
	 */
	var socket;


	/**
	 * Envelope queue
	 * @type {Envelope[]}
	 */
	var queue = [];


	/**
	 * Client connection instance.
	 * @type {ClientConnection}
	 */
	var connection;


	/**
	 * JS magic
	 * @type {module}
	 */
	var self = this;


	/**
	 * Initiates connection to backend over WebSocket.
	 */
	var connect = function () {
		var address = 'ws://' + host + ':' + port + '/socket';

		socket = new W3CWebSocket(address, 'endpoint');
		socket.onmessage = messageEH;
		socket.onopen = openEH;
		socket.onclose = closeEH;

		var id = `backend,${host}:${port}`;

		connection = {
			id: id,
			emit: self.emit,
			on: self.on
		};

		logger.info('[websocketService:connect][%s] Connecting to %s', id, address);
	};


	/**
	 * WebSocket open handler
	 */
	var openEH = function () {
		logger.info('[websocketService:openEH][%s] Connected to backend', connection.id);

		for (var i = 0; i < handlers.open.length; i++)
			handlers.open[i]();

		run();
	};


	/**
	 * WebSocket close handler
	 */
	var closeEH = function () {
		logger.info('[websocketService:closeEH][%s] Socket closed', connection.id);

		socket.onmessage = undefined;
		socket.onopen = undefined;
		socket.onclose = undefined;

		for (var i = 0; i < handlers.close.length; i++)
			handlers.close[i]();

		setTimeout(connect, config.websocket.client.reconnect_timeout);
	};


	/**
	 * WebSocket message handler
	 *
	 * @param {{data: string}} event WebSocket message event
	 */
	var messageEH = function (event) {
		var envelope = JSON.parse(event.data);

		logger.silly('[websocketService:messageHandler][%s] Received envelope: %s', connection.id, event.data);

		for (var i = 0; i < handlers.message.length; i++)
			handlers.message[i](envelope.type, envelope.message);
	};


	/**
	 * Register handler for events of given type.
	 * Supported event types: open, close, message
	 *
	 * @param {string} type Event type
	 * @param {function} handler Event handler function
	 */
	this.on = function (type, handler) {
		if (type in handlers) {
			handlers[type].push(handler);
		} else {
			throw new Error('Unknown event type: ' + type);
		}
	};


	/**
	 * Sends envelope through WebSocket wire.
	 *
	 * @param {{type: string, message: object}} envelope An envelope to be send
	 */
	var send = function (envelope) {
		if (socket.readyState != WS_RS_OPEN)
			return;

		var data = JSON.stringify(envelope);

		socket.send(data);
		logger.silly('[websocketService:run][%s] Sent envelope: %s', connection.id, data);
	};


	/**
	 * Processes one entry from send queue.
	 */
	var run = function () {
		var envelope;

		if (queue.length == 0)
			return;

		if (socket.readyState != WS_RS_OPEN)
			return;

		envelope = queue.pop();

		send(envelope);

		run();
	};


	/**
	 * Schedules message to be sent over WebSocket connection.
	 *
	 * @param {string} type Message type
	 * @param {object} message Message contents
	 */
	this.emit = function(type, message) {
		var envelope = {
			type: type,
			message: message
		};

		queue.push(envelope);

		run();

		return q(true);
	};


	/**
	 * Returns client connection instance.
	 *
	 * @returns {ClientConnection}
	 */
	this.connection = () => connection;


	// initialization
	connect();


};