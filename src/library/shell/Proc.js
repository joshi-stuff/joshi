const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

/**
 * Interface for generic objects implementing redirections (other than Proc).
 *
 * @interface
 * @memberof shell
 */
function Redirection() {}

Redirection.prototype = {
	/**
	 * Open fd associated to this redirection
	 *
	 * @returns {number}
	 * @throws {SysError}
	 */
	open: function (sourceFd) {
		throw new Error('Not implemented!');
	},

	/**
	 * Close fds associated to this redirection
	 *
	 * @returns {void}
	 * @throws {SysError}
	 */
	close: function () {
		throw new Error('Not implemented!');
	},
};

/**
 * @interface
 * @memberof shell
 */
function Proc($, argv) {
	this.$ = $;
	this.is_a = 'Proc';
	this.argv = argv;

	this._dir = undefined;
	this._env = {};

	// Pipe is initial configuration
	this._pipe = {};

	// Redir is actual fd wiring
	this._redir = {};
}

Proc.prototype = {
	/**
	 * Set working directory for process
	 *
	 * @param {string} dir Path to a directory
	 * @returns {shell.Proc}
	 * The same object where it is being invoked (for chaining)
	 */
	dir: function (dir) {
		this._dir = dir;
		return this;
	},

	/**
	 * Set environment variables for process
	 *
	 * @param {object} vars
	 * A hash of key value pairs.
	 *
	 * Note that a null value unsets the variable.
	 *
	 * @returns {shell.Proc}
	 * The same object where it is being invoked (for chaining)
	 */
	env: function (vars) {
		this._env = vars;
		return this;
	},

	/**
	 * Run a complete execution graph and wait for it to finish.
	 *
	 * @returns {ProcResult} The result of waiting for the last (deepest) child
	 * @see {module:proc.waitpid}
	 * @throws {SysError}
	 */
	do: function () {
		// Get Procs
		const childProcs = [this].concat(this._collectChildProcs());

		// Check if commands can be found
		for (var i = 0; i < childProcs.length; i++) {
			const childProc = childProcs[i];

			if (this.$.search_path(childProc.argv[0]) === null) {
				throw new Error('Command not found: ' + childProc.argv[0]);
			}
		}

		// Store open fds
		const openFds = [];

		try {
			// Setup redirections
			for (var i = 0; i < childProcs.length; i++) {
				openFds = openFds.concat(childProcs[i]._setupRedirections());
			}

			// Launch the Procs
			for (var i = 0; i < childProcs.length; i++) {
				const childProc = childProcs[i];

				childProc._launch(function () {
					// Setup redirections storing used fds
					const fds = Object.keys(childProc._redir);
					const usedFds = {};

					for (var i = 0; i < fds.length; i++) {
						const fd = fds[i];
						const fdTo = childProc._redir[fd];

						io.dup2(fdTo, fd);
						io.close(fdTo);

						usedFds[fdTo] = true;
					}

					// Close inherited fds not used by this child
					for (var i = 0; i < openFds.length; i++) {
						const fd = openFds[i];

						if (!usedFds[fd]) {
							io.close(fd);
						}
					}
				});
			}

			// Wait for parent Procs to finish and get result from last child
			const last = childProcs.length - 1;

			for (var i = 0; i < last; i++) {
				childProcs[i].wait();
			}

			const result = childProcs[last].wait();

			// Close redirections after execution
			const redirections = this._collectRedirections();
			for (var i = 0; i < redirections.length; i++) {
				redirections[i].close();
			}

			return result;
		} finally {
			// Close open fds (in case anything goes wrong)
			for (var i = 0; i < openFds.length; i++) {
				io.close(openFds[i], false);
			}
		}
	},

	/**
	 * Redirect a process file descriptor to a capture
	 * {@link module:shell.capture}, file {@link module:shell.file}, here
	 * string {@link module:shell.here}, or another process
	 * {@link module:shell.$}.
	 *
	 * @param {number|number[]} [fds=[1]]
	 * Process' file descriptors to pipe to the capture, file, here string or
	 * process.
	 *
	 * Note that, in the case of capture or processes, only output file
	 * descriptors make sense.
	 *
	 * In the case of here string, only input file descriptors make sense.
	 *
	 * @param {object|Proc|number|string|string[]|null} where
	 * Polymorphic parameter to express where to pipe to. Depending on the type
	 * it can be:
	 *
	 * -Proc: redirects output of this process to the other process. Valid
	 *  source `fds` are 1 (stdout) and 2 (stderr).
	 *
	 * -Opaque return from {@link module:shell.capture}: redirects output of
	 *  this process to an object variable. Valid fds are 1 and 2 which store to
	 *  properties `out` and `err`.
	 *
	 * -Opaque return from {@link module:shell.file}: redirects input/output
	 *  from/to a file. All fds are valid.
	 *
	 * -Opaque return from {@link module:shell.here}: redirects input from a
	 *  string variable. Only fd 0 (stdin) is valid.
	 *
	 * -number: the source fds are redirected to the given fd
	 *
	 * -{}: if an empty object is given it is wrapped with
	 *  {@link module:shell.capture}
	 *
	 * -string: the string is wrapped with {@link module:shell.file} with
	 *  default open mode. If a custom open mode is desired, the file can be
	 *  prefixed with the mode plus a colon (for example: '+:/tmp/my-file'
	 *  appends to '/tmp/my-file', '0:out.log' truncates, and so on).
	 *
	 * -string[]: the one and only string inside the array is wrapped with
	 *  {@link module:shell.here()}
	 *
	 * -null: same as `$.file('/dev/null')`
	 *
	 * @returns {shell.Proc}
	 * The same object where it is being invoked (for chaining)
	 *
	 *  @throws {SysError}
	 */
	pipe: function (fds, where) {
		const $ = this.$;

		// Normalize arguments
		if (where === undefined) {
			where = fds;
			fds = [1];
		}
		if (!Array.isArray(fds)) {
			fds = [fds];
		}

		// Handle aliased behaviors (except null)
		if (where === null) {
			// do nothing
		} else if (typeof where === 'string') {
			if (where.startsWith('0:')) {
				where = $.file(where.substring(2), '0');
			} else if (where.startsWith('+:')) {
				where = $.file(where.substring(2), '+');
			} else if (where.startsWith(':')) {
				where = $.file(where.substring(1), '');
			} else {
				where = $.file(where);
			}
		}

		// TODO: this is a mess, generalize it for every openable case and single/multi fds
		// /dev/null
		if (where === null) {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = $.file('/dev/null');
			}
		}
		// capure: $.capture
		else if (where.is_a === 'Capture') {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = where;
			}
		}
		// capture: {}
		else if (typeof where === 'object' && Object.keys(where).length === 0) {
			where = $.capture(where);

			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = where;
			}
		}
		// herestring: ['']
		else if (Array.isArray(where) && typeof where[0] === 'string') {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = $.here(where[0]);
			}
		}
		// Proc: $(...)
		else if (where.is_a === 'Proc') {
			// Redirect first fd to where
			this._pipe[fds[0]] = where;

			// Redirect rest of fds to first fd
			for (var i = 1; i < fds.length; i++) {
				this._pipe[fds[i]] = fds[0];
			}
		}
		// EphemeralFd: $.file, $.here, ...
		else if (where.is_a === 'EphemeralFd') {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = where;
			}
		}
		// another fd
		else if (typeof where === 'number') {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = where;
			}
		} else {
			throw new Error('Unsupported redirection target: ' + where);
		}

		return this;
	},

	/**
	 * Return a string representation of the object
	 *
	 * @returns {string}
	 * @ignore
	 */
	toString: function () {
		return (
			'Proc{' +
			'"' +
			this.argv.join(' ') +
			'"' +
			(this.pid ? ', pid: ' + this.pid : '') +
			'}'
		);
	},

	/**
	 * Wait for process to finish and get its exit status
	 *
	 * @return {ProcResult} The wait process result
	 * @throws {SysError}
	 * @private
	 */
	wait: function () {
		return proc.waitpid(this.pid);
	},

	/**
	 * Collect all child Proc objects (excluding the one invoking the method).
	 *
	 * @returns {shell.Proc[]}
	 * @private
	 */
	_collectChildProcs: function () {
		const childProcs = [];

		const fds = Object.keys(this._pipe);

		for (var i = 0; i < fds.length; i++) {
			const fd = fds[i];
			const where = this._pipe[fd];

			if (where.is_a === 'Proc') {
				childProcs.push(where);
				childProcs = childProcs.concat(where._collectChildProcs());
			}
		}

		return childProcs;
	},

	/**
	 * Recursively collect all redirection target objects (i.e. Capture,
	 * EphemeralFd, ...)
	 *
	 * @returns {Redirection[]}
	 * @private
	 */
	_collectRedirections: function () {
		const closeables = [];

		const fds = Object.keys(this._pipe);

		for (var i = 0; i < fds.length; i++) {
			const fd = fds[i];
			const where = this._pipe[fd];

			if (typeof where.close === 'function') {
				if (!closeables.includes(where)) {
					closeables.push(where);
				}
			} else if (where.is_a === 'Proc') {
				// Recurse into child processes
				closeables = closeables.concat(where._collectRedirections());
			}
		}

		return closeables;
	},

	/**
	 * Setup redirections collecting all fds and objects in this._pipe and
	 * putting their associated fds in this._redir.
	 *
	 * Note that any object in this._pipe other than Proc that implements
	 * the {@link Redirection} interface (f.e. Capture and EphemeralFd) is handled
	 * generically.
	 *
	 * @returns {number[]}
	 * An array containing all file descriptors that have been open as a
	 * consequence of redirections.
	 *
	 * @throws {SysError}
	 * @private
	 */
	_setupRedirections: function () {
		const openFds = [];

		try {
			const fds = Object.keys(this._pipe);

			for (var i = 0; i < fds.length; i++) {
				const fd = fds[i];
				const where = this._pipe[fd];

				if (where.is_a === 'Proc') {
					if (where._pipe[0]) {
						throw new Error(
							'Proc ' +
								where +
								' stdin is redirected to both ' +
								where._pipe[0] +
								' and ' +
								this
						);
					}

					const pipe = io.pipe();

					this._redir[fd] = pipe[1];
					openFds.push(this._redir[fd]);

					where._redir[0] = pipe[0];
					openFds.push(where._redir[0]);
				} else if (typeof where.open === 'function') {
					this._redir[fd] = where.open(fd);
					openFds.push(this._redir[fd]);
				} else if (typeof where === 'number') {
					this._redir[fd] = where;
				} else {
					throw new Error(
						'Unsupported redirection for fd ' +
							fd +
							' of ' +
							this +
							': ' +
							where
					);
				}
			}
		} catch (err) {
			// Don't leak open fds
			for (var i = 0; i < openFds.length; i++) {
				io.close(openFds[i], false);
			}

			throw err;
		}

		return openFds;
	},

	/**
	 * Launch the process without waiting for it (only this process, not the
	 * children)
	 *
	 * @param {function} [setupCB]
	 * A function invoked just before exec to setup the child process for
	 * execution. It doesn't receive parameters or return anything.
	 *
	 * @returns {Proc} The Proc where it is being invoked
	 * @throws {SysError}
	 * @private
	 */
	_launch: function (setupCB) {
		const self = this;

		const pid = proc.fork(function () {
			if (setupCB) {
				setupCB();
			}

			if (self._dir) {
				proc.chdir(self._dir);
			}

			proc.exec(self.argv[0], self.argv.slice(1), { env: self._env });
		});

		// Store child pid in root process
		this.pid = pid;

		return this;
	},
};

return Proc;
