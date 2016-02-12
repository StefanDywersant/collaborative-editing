/**
 * Service responsible for estimating current clock state on backend
 *
 * @param {{on: function(string, function(object)), emit: function(string, function(object))}} wss WebSocket service instance
 * @returns {{ts: Promise.number}}
 */
window.driftService = function(wss) {


	/**
	 * How long to wait for confirmation from backend
	 * @type {number}
	 */
	var UNCONFIRMED_TTL = 120000;


	/**
	 * Interval between subsequent cleans of unconfirmed messages list
	 * @type {number}
	 */
	var GC_INTERVAL = 60000;


	/**
	 * Timestamp queries interval
	 * @type {number}
	 */
	var EMIT_INTERVAL = 3000;


	/**
	 * Current drift from backend's clock.
	 * @type {?number}
	 */
	var drift = null;


	/**
	 * Unconfirmed queries list
	 * @type {object<string,number>}
	 */
	var unconfirmed = {};


	/**
	 * Deferred resolved on first drift comming back from backend
	 * @type {object}
	 */
	var deferred = jQuery.Deferred();


	/**
	 * Returns promise which resolves to estimated timestamp on backend.
	 *
	 * @returns {Promise.number}
	 */
	var ts = function() {
		return deferred.promise().then(function() {
			return Date.now() + drift;
		});
	};


	/**
	 * Updates client side clock drift with data received from backend.
	 *
	 * @param {object} message Message received from backend
	 */
	var update = function(message) {
		if (!(message.id in unconfirmed)) {
			logger.error('[driftService:update] Received unknown message', message);
			return;
		}

		var latency = (Date.now() - unconfirmed[message.id]) / 2;
		drift = Math.floor(Date.now() - message.ts + latency);

		delete unconfirmed[message.id];

		deferred.resolve();

		logger.log('[driftService:update] Current clock drift is ' + drift + 'ms');
	};


	/**
	 * Removes outdated unconfirmed messages.
	 */
	var gc = function() {
		var ids = Object.keys(unconfirmed);

		for (var i = 0; i < ids.length; i++) {
			var id = ids[i];

			if (unconfirmed[id] + UNCONFIRMED_TTL < Date.now()) {
				delete unconfirmed[id];
			}
		}
	};


	/**
	 * Generates almost random string identifier.
	 *
	 * @returns {string}
	 */
	var genID = function() {
		return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
	};


	/**
	 * Emits timestamp query to backend.
	 */
	var emit = function() {
		var id = genID();

		wss.emit('ts', {id: id}, true);

		unconfirmed[id] = Date.now();
	};


	/**
	 * Initializes clock drift service.
	 */
	var init = function() {
		setInterval(gc, GC_INTERVAL);
		setInterval(emit, EMIT_INTERVAL);
		wss.on('ts', update);
	};


	init();


	// public interface
	return {
		ts: ts
	};


};