var logger = require('../service/logger');


/**
 * Maps form name to connection array
 * @type {object<string, ClientConnection[]>}
 */
var connections = {};


/**
 * Adds or updates form->connection binding.
 *
 * @param {string} form Form name
 * @param {ClientConnection} connection Client connection instance
 */
var upsert = function(form, connection) {
	if (!(form in connections)) {
		connections[form] = [connection];
		logger.silly('[form.connections:upsert][%s] Created form=%s entry and attached connection', connection.id, form);
		return;
	}

	if (connections[form].indexOf(connection) < 0) {
		connections[form].push(connection);
		logger.silly('[form.connections:upsert][%s] Attached to form=%s', connection.id, form);
		return;
	}

	logger.silly('[form.connections:upsert][%s] Already attached to form=%s', connection.id, form);
};


/**
 * Detaches given connection from all forms.
 *
 * @param {ClientConnection} connection Client connection instance
 */
var detach = function(connection) {
	Object.keys(connections).forEach((form) => {
		var idx = connections[form].indexOf(connection);

		if (idx < 0)
			return;

		connections[form].splice(idx, 1);

		logger.debug('[form.connections:detach][%s] Removed connection from form=%s', connection.id, form);
	});
};


/**
 * Returns all connections attached to given form.
 *
 * @param {string} form Form name
 * @returns {ClientConnection[]}
 */
var get = function(form) {
	return form in connections ? connections[form] : [];
};


// public interface
module.exports = {
	upsert: upsert,
	detach: detach,
	get: get
};