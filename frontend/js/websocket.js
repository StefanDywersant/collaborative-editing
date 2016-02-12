window.websocketService = function() {


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
	 * @type {Object}
	 */
	var handlers = {};


	/**
	 * WebSocket instance
	 * @type {WebSocket}
	 */
	var socket;


	/**
	 * Envelope queue
	 * @type {Object[]}
	 */
	var queue = [];


	/**
	 * Initiates connection to backend over WebSocket.
	 */
	var connect = function () {
		socket = new WebSocket('ws://' + location.hostname + ':' + location.port + '/socket', 'endpoint');
		socket.onmessage = messageHandler;
		socket.onopen = openHandler;
		socket.onclose = closeHandler;

		logger.log('[websocketService:connect] Connecting to backend...');
	};


	/**
	 * WebSocket open handler
	 */
	var openHandler = function() {
		logger.log('[websocketService:openHandler] Connected to backend');
		run();
	};


	/**
	 * WebSocket close handler
	 */
	var closeHandler = function() {
		logger.log('[websocketService:closeHandler] Socket closed');

		socket.onmessage = undefined;
		socket.onopen = undefined;
		socket.onclose = undefined;

		setTimeout(connect, RECONNECT_TIMEOUT);
	};


	/**
	 * WebSocket message handler
	 */
	var messageHandler = function(event) {
		var envelope = JSON.parse(event.data);

		logger.log('[websocketService:messageHandler] Received envelope', envelope);

		if (envelope.type in handlers) {
			handlers[envelope.type].forEach(function (handler) {
				handler(envelope.message);
			});
		}
	};


	/**
	 * Register handler for message of given type.
	 *
	 * @param {string} type Message type
	 * @param {function(object)} handler Handler function which accepts message as first argument
	 */
	var on = function(type, handler) {
		if (type in handlers) {
			handlers[type].push(handler);
		} else {
			handlers[type] = [handler];
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


	connect();


	// public interface
	return {
		on: on,
		emit: emit
	};


};