const fs = require('fs');
const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

const Capture = require('./Capture.js');
const EphemeralFd = require('./EphemeralFd.js');
const Proc = require('./Proc.js');

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
		args.push(arguments[0]);
	} else if (Array.isArray(arguments[0])) {
		args = arguments[0];
	} else {
		throw new Error('Invalid arguments: ' + arguments);
	}

	return new Proc($, args);
}

$.capture = function(container) {
	return new Capture($, container);
}

/**
 * @param [undefined|''|'0'|'+'] mode
 * Default mode for fd 1 and 2 is '0' (truncate), for the rest it is '' (open).
 * Mode '+' is append.
 */
$.file = function(filepath, mode) {
	return new EphemeralFd($, function(sourceFd) {
		sourceFd = Number(sourceFd);

		if (!mode) {
			if (sourceFd === 1 || sourceFd === 2) {
				mode = '0';
			}
			else {
				mode = '';
			}
		}

		switch(mode) {
			case '':
				return io.open(filepath);

			case '+':
				return io.append(filepath);

			case '0':
				return io.truncate(filepath);
		}

		throw new Error('Unknown mode: ' + mode);
	});
}

$.here = function(here_string) {
	return new EphemeralFd($, function(sourceFd) {
		const filepath = fs.mktemp_file(here_string, 0400);
		const fd = io.open(filepath);
		fs.unlink(filepath);
		return fd;
	});
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
