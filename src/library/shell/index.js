const fs = require('fs');
const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

const Capture = require('./Capture.js');
const EphemeralFd = require('./EphemeralFd.js');
const Proc = require('./Proc.js');

/**
 * Note that this module exports the {@link module:shell.$} function as a
 * property `shell.$` and as `shell` directly.
 *
 * That means that you can use more than one syntax when requiring it (see
 * examples).
 *
 * @example
 * // Recommended syntax
 * const $ = require('shell');
 *
 *
 *          OR
 *
 *
 * // Alternative syntax
 * const $ = require('shell').$;
 *
 *
 *          OR
 *
 *
 * // Orthodox syntax...
 * const shell = require('shell');
 *
 * // ...then invoke it with prefix
 * shell.$(....)
 *
 * @exports shell
 */
var shell = {};

/**
 * Declare a shell command to be wired and executed. This is the base function
 * to invoke commands in a shell fashion.
 *
 * @example
 * // Execute `ls -l` as bash would do
 * $('ls', '-l').do();
 *
 * @example
 * // Execute `ls -l > ls.out` as bash would do
 * $('ls', '-l')
 *   .pipe(1, $.file('ls.out'))
 *   .do();
 *
 * // Alternative human friendly syntax
 * $('ls', '-l')
 *   .pipe(1, 'ls.out')
 *   .do();
 *
 * @example
 * // Execute `more < ls.out` as bash would do
 * $('more')
 *   .pipe(0, $.file('ls.out'))
 *   .do();
 *
 * // Alternative human friendly syntax
 * $('more')
 *   .pipe(0, 'ls.out')
 *   .do();
 *
 * @example
 * // Execute `more <<HERE_STRING_END ... HERE_STRING_END` as bash would do
 * $('more')
 *   .pipe(0, $.here('...'))
 *   .do();
 *
 * // Alternative human friendly syntax
 * $('more')
 *   .pipe(0, ['...'])
 *   .do();
 *
 * @example
 * // Execute `X=$(ls -l)` as bash would do
 * const x = {};
 * $('ls', '-l')
 *   .pipe(1, $.capture(x))
 *   .do();
 *
 * // Alternative human friendly syntax
 * $('ls', '-l')
 *   .pipe(1, x)
 *   .do();
 *
 * @example
 * // Execute `rm file >/dev/null 2>&1` as bash would do
 * $('rm', 'file')
 *   .pipe([1, 2], $.file('/dev/null'))
 *   .do();
 *
 * // Alternative human friendly syntax
 * $('rm', 'file')
 *   .pipe([1, 2], null)
 *   .do();
 *
 * @example
 * // Execute
 * // `cd src && LANG=en ls -l | grep -v node_modules >> files.list 2> /dev/null`
 * // as bash would do it
 * $('ls', '-l')
 *   .dir('src')
 *   .env({LANG: 'en'})
 *   .pipe(
 *     1,
 *     $('grep', '-v', 'node_modules')
 *       .pipe(1, '+:files.list')
 *       .pipe(2, null)
 *   )
 *   .do();
 *
 * @param {...string|string[]} tokens
 * Program and arguments to execute as an array or a list of string arguments
 *
 * @returns {shell.Proc}
 * A Proc object that provides a fluent API to configure the process wiring
 *
 * @throws {SysError}
 */
shell.$ = function () {
	const args = [];

	if (arguments.length > 1) {
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

	return new Proc(shell, args);
};

/* Point `$` to `shell` directly */
shell = shell.$;

/**
 * Declare a redirection to save the output or a process to an `object`
 * variable.
 *
 * Note that there's also an alternative human friendly syntax that can be used
 * instead of `$.capture(...)` (see {@link Proc.pipe}).
 *
 * @example
 * // Execute `X=$(ls -l)` as bash would do
 * const x = {};
 * $('ls', '-l')
 *   .pipe(1, $.capture(x))
 *   .do();
 *
 * @param {object} container
 * An empty object where the output of the piped file descriptor will be stored
 * as a property.
 *
 * The names of the properties are `out` and `error` for file descriptors 1 and
 * 2, and the file descriptor number for the other.
 *
 * @return {object}
 * An opaque object to be fed to {@link Proc.pipe}
 *
 * @throws {SysError}
 * @see {@link Proc.pipe}
 */
shell.capture = function (container) {
	return new Capture(shell, container);
};

/**
 * Create a redirection to pipe a process to/from a file.
 *
 * Note that there's also an alternative human friendly syntax that can be used
 * instead of `$.capture(...)` (see {@link Proc.pipe}).
 *
 * @example
 * // Execute `ls -l > ls.out` as bash would do
 * $('ls', '-l')
 *   .pipe(1, $.file('ls.out'))
 *   .do();
 *
 * @example
 * // Execute `more < ls.out` as bash would do
 * $('more')
 *   .pipe(0, $.file('ls.out'))
 *   .do();
 *
 * @param {string} filepath The path to the file
 *
 * @param {''|'0'|'+'} [mode='0' for stdout/err, '' for the rest]
 * The open mode for the file.
 *
 * Use '' to open the file with {@link module:io.open}.
 *
 * Use '0' to open the file with {@link module:io.truncate}.
 *
 * Use '+' to open the file with {@link module:io.append}.
 *
 * @return {object} An opaque object to be fed to {@link Proc.pipe}
 * @throws {SysError}
 * @see {@link Proc.pipe}
 */
shell.file = function (filepath, mode) {
	return new EphemeralFd(shell, function (sourceFd) {
		sourceFd = Number(sourceFd);

		if (!mode) {
			if (sourceFd === 1 || sourceFd === 2) {
				mode = '0';
			} else {
				mode = '';
			}
		}

		var access = 'rw';

		if (sourceFd === 0) {
			access = 'r';
		} else if (sourceFd === 1 || sourceFd === 2) {
			access = 'w';
		}

		switch (mode) {
			case '':
				return io.open(filepath, access);

			case '+':
				return io.append(filepath);

			case '0':
				return io.truncate(filepath, access);
		}

		throw new Error('Unknown mode: ' + mode);
	});
};

/**
 * Create a redirection to get a process' input from a here string.
 *
 * Note that there's also an alternative human friendly syntax that can be used
 * instead of `$.capture(...)` (see {@link Proc.pipe}).
 *
 * @example
 * // Execute `more <<HERE_STRING_END ... HERE_STRING_END` as bash would do
 * $('more')
 *   .pipe(0, $.here('...'))
 *   .do();
 *
 * @param {string} here_string The contents of the here string
 * @return {object} An opaque object to be fed to {@link Proc.pipe}
 * @throws {SysError}
 * @see {@link Proc.pipe}
 */
shell.here = function (here_string) {
	return new EphemeralFd(shell, function (sourceFd) {
		const filepath = fs.create_temp_file(here_string, 0400);
		const fd = io.open(filepath, 'r');
		fs.unlink(filepath);
		return fd;
	});
};

/**
 * Search PATH environment variable for a certain executable (command)
 *
 * @param {string} command Command to look for in PATH
 * @returns {string|null} The absolute path to the command or null if not found
 * @throws {SysError}
 */
shell.search_path = function (command) {
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
};

return shell;
