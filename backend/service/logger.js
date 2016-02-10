var winston = require('winston'),
	config = require('config');

module.exports = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			colorize: true,
			level: config.logger.level,
			timestamp: true
		})
	]
});