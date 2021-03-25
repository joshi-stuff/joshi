const io = require('io');
const stream = require('stream');

/** 
 * @enum {number}
 * @exports term 
 * @readonly
 */
const term = {
	/** Canonical terminal mode */
	CANONICAL: 0,
	/** Password (canonical without echo) terminal mode */
	PASSWORD: 1,
	/** Raw terminal mode */
	RAW: 2
};

// See https://en.wikipedia.org/wiki/ANSI_escape_code
const CSI = String.fromCharCode(0x1B) + '['; 
const stdin = stream.create(0);

/**
 * Set text background color to RGB value
 *
 * @param {number} r Red value
 * @param {number} g Green value
 * @param {number} b Blue value
 * @returns {void}
 * @throws {SysError}
 */
term.bg = function(r, g, b) {
	term.print(CSI + '48;2;' + r + ';' + g + ';' + b + 'm');
}

/**
 * Clear terminal screen and move cursor to (1, 1)
 *
 * @returns {void}
 * @throws {SysError}
 */
term.clear = function() {
	term.print(CSI + '2J');
	term.move_to(1, 1);
}

/**
 * Set terminal mode to canonnical, password or raw.
 *
 * @param {number} mode
 * One of {link module:term.CANONICAL}, {link module:term.PASSWORD} and 
 * {link module:term.RAW} constants.
 *
 * @returns {void}
 * @throws {SysError}
 */
term.set_mode = function(mode) {
	j.set_term_mode(mode);
}

/**
 * Set text foreground color to RGB value
 *
 * @param {number} r Red value
 * @param {number} g Green value
 * @param {number} b Blue value
 * @returns {void}
 * @throws {SysError}
 */
term.fg = function(r, g, b) {
	term.print(CSI + '38;2;' + r + ';' + g + ';' + b + 'm');
}

/**
 * Hide cursor
 *
 * @returns {void}
 * @throws {SysError}
 */
term.hide_cursor = function() {
	term.print(CSI + '?25l');
}

/**
 * Move cursor to coordinate
 *
 * @param {number} row Row (starting at 1)
 * @param {number} column Column (starting at 1)
 * @returns {void}
 * @throws {SysError}
 */
term.move_to = function(row, column) {
	term.print(CSI + row + ';' + column + 'H');
}

/**
 * Print one or more items to stderr
 *
 * @param {...*} items Items to print
 * @returns {void}
 * @throws {SysError}
 */
term.print2 = function() {
	_print(2, arguments, false);
}

/**
 * Print one or more items to stdout
 *
 * @param {...*} items Items to print
 * @returns {void}
 * @throws {SysError}
 */
term.print = function() {
	_print(1, arguments, false);
}

/**
 * Print one or more items to stdout, then append a line feed
 *
 * @param {...*} items Items to print
 * @returns {void}
 * @throws {SysError}
 */
term.println = function() {
	_print(1, arguments, true);
}

/**
 * Print one or more items to stderr, then append a line feed
 *
 * @param {...*} items Items to print
 * @returns {void}
 * @throws {SysError}
 */
term.println2 = function() {
	_print(2, arguments, true);
}

/**
 * Read a line of text from stdin.
 *
 * Note that this method uses an underlying stream to make readings more 
 * efficient.
 *
 * @returns {string} A line or null on EOF
 * @throws {SysError}
 */
term.read_line = function() {
	return stream.read_line(stdin);
}

/**
 * Reset terminal to default values (foreground and background color, etc.)
 *
 * @returns {void}
 * @throws {SysError}
 */
term.reset = function() {
	term.print(CSI + 'm');
}

/**
 * Make cursor visible
 *
 * @returns {void}
 * @throws {SysError}
 */
term.show_cursor = function() {
	term.print(CSI + '?25h');
}

/**
 * Return a string representation of an item
 *
 * @param {*} thing The item
 * @returns {string} The string representation of the item
 * @throws {SysError}
 */
term.to_string = function(thing) {
	const str = '';

	if (thing === null) {
		str += '(null)';
	} else if (thing === undefined) {
		str += '(undefined)';
	} else if (Array.isArray(thing)) {
		str += '[';

		for (var i = 0; i < thing.length; i++) {
			if (i > 0) {
				str += ', ';
			}

			str += term.to_string(thing[i]);
		}

		str += ']';
	} else if (thing.toString() === '[object Object]') {
		str += '{';

		const keys = Object.keys(thing);
		for (var i = 0; i < keys.length; i++) {
			const key = keys[i];

			if (i > 0) {
				str += ', ';
			}

			str += key + ': ';
			str += term.to_string(thing[key]);
		}

		str += '}';
	} else {
		str += thing.toString();
	}

	return str;
}

/**
 * Internal print logic
 *
 * @param {number} fd File descriptor to print to
 * @param {Arguments|Array} things Items to print
 * @param {boolean} [lf=false] Whether to print a trailing line feed
 * @returns {void}
 * @throws {SysError}
 * @private
 */
function _print(fd, things, lf) {
	var str = '';

	for (var i = 0; i < things.length; i++) {
		if (i > 0) {
			str += ' ';
		}

		str += term.to_string(things[i]);
	}

	if (lf) {
		str += '\n';
	}

	io.write_string(fd, str);
}

return term;
