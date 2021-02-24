const fs = require('fs');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

const Capture = require('./Capture.js');
const Proc = require('./Proc.js');
const parse = require('./parse.js');

// TODO: $.here(string) support
// TODO: $.append(string) support 
// TODO: $.truncate(string) support 

/*
 *
 * @param [string|...string|string[]]
 */
function $() {
	const args = [];

	if(arguments.length > 1) {
		for (var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
	} else if (typeof arguments[0] === 'string') {
		return args.push(arguments[0]);
	} else if (Array.isArray(arguments[0])) {
		args = arguments[0];
	} else {
		throw new Error('Invalid arguments: ' + arguments);
	}

	return new Proc($, args);
}

$.capture = function(container) {
	return new Capture(this, container);
}

$.search_path = function(command) {
	if (command.includes('/')) {
		return fs.is_executable(command) ? command : null;
	}

	const path = proc.getenv('PATH');

	if (path === null) {
		path = '';
	}

	const dirs = path.split(':');

	for (var i = 0; i < dirs.length; i++) {
		var dir = dirs[i];

		if (dir === '') {
			continue;
		}

		if (dir[dir.length - 1] !== '/') {
			dir += '/';
		}

		if (fs.is_executable(dir + command)) {
			return dir + command;
		}
	}

	return null;
}

return $;
