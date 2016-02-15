var q = require('q'),
	logger = require('../service/logger'),
	formConnections = require('./connections'),
	replConnections = require('../replication/connections');


/**
 * Message type name (outbound)
 * @type {string}
 */
const MESSAGE_TYPE = 'state';


/**
 * Form states dictionary
 * @type {object<string, FormState>}
 */
var localFormStates = {};


/**
 * Returns form state for given form name.
 *
 * @param {string} form Form name
 * @returns {?FormState}
 */
var get = function(form) {
	return form in localFormStates ? localFormStates[form] : null;
};


/**
 * Returns all form states.
 *
 * @returns {FormState[]}
 */
var all = function() {
	return Object.keys(localFormStates).map((form) => localFormStates[form]);
};


/**
 * Sends state update to single connection.
 *
 * @param {ClientConnection} connection Client connection instance
 * @param {FormState} formState Form state instance
 * @returns {Promise}
 */
var emitTo = function(connection, formState) {
	logger.debug('[handler.state:emitTo][%s] Sent state update (form=%s, state=%d)', connection.id, formState.form, formState.state);
	return connection.emit(MESSAGE_TYPE, formState);
};


/**
 * Sends state update to all connections attached to form except one specified.
 *
 * @param {ClientConnection} connection Client connection instance
 * @param {FormState} formState Form state instance
 * @returns {Promise}
 */
var emitToAllExcept = function(connection, formState) {
	return q.all(
		formConnections
			.get(formState.form)
			.concat(replConnections.all())
			.filter((c) => c !== connection)
			.map(function(c) {
				logger.debug('[handler.state:emitToAllExcept][%s] Sent state update (form=%s, state=%d)', c.id, formState.form, formState.state);
				return c.emit(MESSAGE_TYPE, formState);
			})
	);
};


/**
 * Sends form state to connected replicas.
 *
 * @param {FormState} formState Form state instance
 * @returns {Promise}
 */
var emitToReplicas = function(formState) {
	return q.all(
		replConnections
			.all()
			.map((connection) => {
				logger.debug('[handler.state:emitToReplicas][%s] Sent state update (form=%s, state=%d)', connection.id, formState.form, formState.state);
				return connection.emit(MESSAGE_TYPE, formState)
			})
	);
};


/**
 * Performs local form state update (the algorithm you are looking for :))
 *
 * @param {FormState} formState Inbound form state instance
 * @param {ClientConnection} connection Client connection instance
 */
var update = function(formState, connection) {
	var localFormState = get(formState.form);

	// there is no local state for given form
	if (!localFormState) {
		// create local form state based on inbound one
		localFormStates[formState.form] = {
			state: formState.state,
			ts: formState.ts,
			form: formState.form
		};

		// there is only one client connected and his state is the same as ours
		// so we only need to update replica
		emitToReplicas(formState);

		logger.verbose('[form.states:update][%s] Added new form: %s (state=%d, ts=%d)', connection.id, formState.form, formState.state, formState.ts);

		return;
	}

	// our local state is newer than inbound
	if (localFormState.ts > formState.ts) {
		// ignore inbound state

		// inform client about our state
		emitTo(connection, localFormState);

		logger.verbose('[form.states:update][%s] Ignoring update form=%s state=%d', connection.id, formState.form, formState.state);

		return;
	}

	// inbound form state is newer than ours (local)
	// update local form state
	localFormState.state = formState.state;
	localFormState.ts = formState.ts;

	// there might be other clients which need to be informed about state change
	// sender doesn't need to be informed
	emitToAllExcept(connection, localFormState);

	logger.verbose('[form.states:update][%s] Updated form=%s to state=%d', connection.id, formState.form, formState.state);
};


// public interface
module.exports = {
	update: update,
	get: get,
	all: all
};