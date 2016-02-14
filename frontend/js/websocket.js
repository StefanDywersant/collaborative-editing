window.websocketService = function() {


	/**
	 * Envelope enclosing message and it's type
	 * @typedef {{type: string, message: object}} Envelope
	 */


	/**
	 * WebSocket readyState open constant
	 * @type {number}
	 */
	var WS_RS_OPEN = 1;


	/**
	 * How long to wait before reconnecting socket (in ms)
	 * @type {number}
	 */
	var RECONNECT_TIMEOUT = 1000;


	/**
	 * Registered message handlers
	 * @type {{open: function[], close: function[], message: function(string, object)[]}}
	 */
	var handlers = {open: [], close: [], message: []};


	/**
	 * WebSocket instance
	 * @type {WebSocket}
	 */
	var socket;


	/**
	 * Envelope queue
	 * @type {Envelope[]}
	 */
	var queue = [];


	/**
	 * Initiates connection to backend over WebSocket.
	 */
	var connect = function () {
		socket = new WebSocket('ws://' + location.hostname + ':' + location.port + '/socket', 'endpoint');
		socket.onmessage = messageEH;
		socket.onopen = openEH;
		socket.onclose = closeEH;

		logger.log('[websocketService:connect] Connecting to backend...');
	};


	/**
	 * WebSocket open handler
	 */
	var openEH = function() {
		logger.log('[websocketService:openEH] Connected to backend');

		for (var i = 0; i < handlers.open.length; i++)
			handlers.open[i]();

		run();
	};


	/**
	 * WebSocket close handler
	 */
	var closeEH = function() {
		logger.log('[websocketService:closeEH] Socket closed');

		socket.onmessage = undefined;
		socket.onopen = undefined;
		socket.onclose = undefined;

		for (var i = 0; i < handlers.close.length; i++)
			handlers.close[i]();

		setTimeout(connect, RECONNECT_TIMEOUT);
	};


	/**
	 * WebSocket message handler
	 *
	 * @param {{data: string}} event WebSocket message event
	 */
	var messageEH = function(event) {
		var envelope = JSON.parse(event.data);

		logger.log('[websocketService:messageHandler] Received envelope', envelope);

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
	var on = function(type, handler) {
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
	var send = function(envelope) {
		if (socket.readyState != WS_RS_OPEN)
			return;

		socket.send(JSON.stringify(envelope));
		logger.log('[websocketService:run] Sent envelope', envelope);
	};


	/**
	 * Processes one entry from send queue.
	 */
	var run = function() {
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
	 * @param {boolean=false} transitory Transitory messages are not sent when WebSocket is disconnected
	 */
	var emit = function(type, message, transitory) {
		var envelope = {
			type: type,
			message: message
		};

		// transitory messages will be pushed to socket immediately
		if (transitory) {
			send(envelope);
			return;
		}

		// non-transitory messages are pushed through queue
		queue.push(envelope);

		run();
	};


	// public interface
	return {
		on: on,
		emit: emit,
		connect: connect
	};


};