/**
 * Replica connection instances
 * @type {ClientConnection[]}
 */
var connections = [];


/**
 * Adds replica connection.
 *
 * @param {ClientConnection} connection Replica connection instance
 */
var push = function(connection) {
	connections.push(connection);
};


/**
 * Returns all replica connection instances.
 *
 * @returns {ClientConnection[]}
 */
var all = function() {
	return connections;
};


// public interface
module.exports = {
	push: push,
	all: all
};