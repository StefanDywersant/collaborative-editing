/**
 * Service responsible for controlling forms and inputs.
 *
 * @param {{on: function(string, function(object)), emit: function(string, function(object))}} wss WebSocket service instance
 * @param {{ts: function}} ds Clock drift service instance
 */
window.formService = function(wss, ds) {


	/**
	 * Last change timestamp
	 * @type {object<string, number>}
	 */
	var lastTS = {};


	/**
	 * Returns array of form names.
	 *
	 * @returns {string[]}
	 */
	var forms = function() {
		var _forms = [];

		$('input').each(function () {
			var name = $(this).attr('name');

			if (_forms.indexOf(name) < 0)
				_forms.push(name);
		});

		return _forms;
	};


	/**
	 * Checkboxes array for given form.
	 *
	 * @param {string} form Form name
	 * @returns {HTMLElement[]}
	 */
	var inputs = function(form) {
		return $('input[name=' + form + ']');
	};


	/**
	 * State (represented as an integer value) of given form.
	 *
	 * @param {string} form Form name
	 * @returns {number}
	 */
	var state = function(form) {
		var _state = 0;

		inputs(form).each(function(i) {
			_state |= (0 + this.checked) << i;
		});

		return _state;
	};


	/**
	 * Returns a function which will take care of input clicked event.
	 *
	 * @param {string} form Form name
	 * @returns {function()}
	 */
	var changed = function(form) {
		return function() {
			ds.ts().then(function(clientTS) {
				lastTS[form] = clientTS;

				// send state update to backend
				wss.emit('state', {
					form: form,
					state: state(form),
					ts: clientTS
				});
			});
		};
	};


	/**
	 * Handle incoming state update from backend.
	 *
	 * @param {object} message Received message object
	 */
	var receive = function(message) {
		// fill in lastTS
		if (!(message.form in lastTS)) {
			lastTS[message.form] = 0;
		}

		// don't set state if it's older
		if (message.ts <= lastTS[message.form])
			return;

		// set state on inputs of given form
		inputs(message.form).each(function(idx) {
			this.checked = !!((message.state >> idx) & 1);
		});

		// update last change timestamp
		lastTS[message.form] = message.ts;
	};


	/**
	 * Initialize form service
	 */
	var init = function() {
		// bind events of DOM objects
		(function() {
			var f = forms();

			for (var i = 0; i < f.length; i++) {
				inputs(f[i]).on('click', changed(f[i]));
			}
		})();

		// listen to 'state' messages
		wss.on('state', receive);

		// emit initial state
		(function() {
			var _forms = forms();

			for (var i = 0; i < _forms.length; i++) {
				var form = _forms[i];

				wss.emit('state', {
					form: form,
					state: state(form),
					ts: 0
				});
			}
		})();
	};


	init();


};