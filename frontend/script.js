// log to console
window.logger = {
	log: function(msg) {
		var args = Array.prototype.slice.call(arguments, 0);
		args[0] = '[' + (new Date()).toUTCString() + ']' + args[0];
		console.log.apply(console, args);
	},
	error: function(msg) {
		var args = Array.prototype.slice.call(arguments, 1);
		args[0] = '[' + (new Date()).toUTCString() + ']' + args[0];
		console.error.apply(console, args);
	}
};

// connect wires after page load
window.onload = function() {
	var wss = websocketService(),
		ds = driftService(wss),
		fs = formService(wss, ds);
};