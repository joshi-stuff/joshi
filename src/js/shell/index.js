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
	return new Proc($, parse.asArgv(arguments));
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
