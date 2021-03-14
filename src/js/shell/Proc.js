const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

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

	dir: function(dir) {
		this._dir = dir;
		return this;
	},

	env: function(vars) {
		this._env = vars;
		return this;
	},

	/**
	 * Execute a full execution graph and wait for it to exit.
	 */
	do: function() {
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
			// Open pipes
			for (var i = 0; i < childProcs.length; i++) {
				openFds = openFds.concat(childProcs[i]._openPipes());
			}

			// Launch the Procs
			for (var i = 0; i < childProcs.length; i++) {
				const childProc = childProcs[i];

				childProc._launch(function() {
					// Setup redirections
					const fds = Object.keys(childProc._redir);
					const usedFds = {};

					for (var i = 0; i < fds.length; i++) {
						const fd = fds[i];
						const fdTo = childProc._redir[fd];

						io.dup2(fdTo, fd);
						io.close(fdTo);

						usedFds[fdTo] = true;
					}

					// Close fds not belonging to child
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

			// Close openables after execution
			const openables = this._collectOpenables();

			for (var i = 0; i < openables.length; i++) {
				openables[i].close();
			}

			// TODO: move this to the real shell
			/*
			term.fg(0xD0, 0x80, 0x80);
			if (result.exit_status != 0) {
				println('Command exited with code:', result.exit_status);
			} else if (result.signaled) {
				println('Command received signal:', result.signaled);
			} else if (result.core_dump) {
				println('Command core dumped');
			}
			term.reset();
			*/

			return result;
		} 
		finally {
			// Close open fds 
			for (var i = 0; i < openFds.length; i++) {
				io.safe_close(openFds[i]);
			}
		}
	},

	/**
	 * @param [number|number[]] fds? default is [1]
	 * @param [Proc|Capture|EphemeralFd|number|{}|string|string[]|null] where
	 * Polymorphic parameter to express where to pipe to. Depending on the type
	 * it can be:
	 *
	 * -Proc: pipes output of this to the parameter
	 *     * Valid fds are only 1 or 2
	 *
	 * -Capture: pipes output of this to an object variable
	 *     * Valid fds are 1 and 2 which store to properties `out` and `error`
	 *
	 * -EphemeralFd: pipes input/output from/to a file descriptor that is open
	 *	for the life of the proces only.
	 *     * All fds are valid (see $.file and $.here for different behaviors)
	 *
	 * -number: the source and given fds are piped together
	 *
	 * -{}: if an empty object is given it is wrapped in a Capture
	 *
	 * -string: the string is wrapped with $.file() with default open mode. If a
	 *  custom open mode is desired, the file can be prefixed with the mode plus
	 *  a colon (for example: '+:/tmp/my-file' appends to '/tmp/my-file')
	 *
	 * -string[]: the one and only string inside the array is wrapped with 
	 *  $.here()
	 *
	 * -null: same as $.file('/dev/null')
	 *
	 */
	pipe: function(fds, where) {
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
		}
		else if (typeof where === 'string') {
			if (where.startsWith('0:')) {
				where = $.file(where.substring(2), '0');
			}
			else if (where.startsWith('+:')) {
				where = $.file(where.substring(2), '+');
			}
			else if (where.startsWith(':')) {
				where = $.file(where.substring(1), '');
			}
			else {
				where = $.file(where);
			}
		}

		// TODO: this is a mess, generalize it for every openable case and single/multi fds
		// /dev/null
		if (where === null ) {
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
		}
		else {
			throw new Error('Unsupported redirection target: ' + where);
		}

		return this;
	},

	toString: function() {
		return 'Proc{' + 
			'"' + this.argv.join(' ') + '"' +
			(this.pid 
				? (', pid: ' + this.pid)
				: '') +
			'}';
	},

	/**
	 * Wait for process to finish and get its exit status
	 *
	 * @return [number] the exit status of the process
	 */
	wait: function() {
		return proc.waitpid(this.pid);
	},

	/**
	 * Recursively collect all this._pipe objects with an open() method (i.e. 
	 * Capture, EphemeralFd, ...)
	 */
	_collectOpenables: function() {
		const openables = [];

		const fds = Object.keys(this._pipe);

		for (var i = 0; i < fds.length; i++) {
			const fd = fds[i];
			const where = this._pipe[fd];

			if (where.is_a === 'Capture') {
				if (!openables.includes(where)) {
					openables.push(where);
				}
			}
			else if (where.is_a === 'Proc' ) {
				openables = openables.concat(where._collectOpenables());
			}
		}

		return openables;
	},

	_collectChildProcs: function() {
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
	 * Scans this._pipe and puts associated fds in this._redir
	 */
	_openPipes: function() {
		const openFds = [];

		try {
			const fds = Object.keys(this._pipe);

			for (var i = 0; i < fds.length; i++) {
				const fd = fds[i];
				const where = this._pipe[fd];

				if (where.is_a === 'Proc') {
					if (where._pipe[0]) {
						throw new Error(
							'Proc ' + where + ' stdin is redirected to both ' +
							where._pipe[0] + ' and ' + this
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
						'Unsupported redirection for fd ' + fd + ' of ' + 
						this + ': ' + where
					); 
				}
			}
		} 
		catch(err) {
			// Don't leak open fds
			for (var i = 0; i < openFds.length; i++) {
				io.safe_close(openFds[i]);
			}

			throw err;
		}

		return openFds;
	},

	/**
	 * Launch the process without waiting for it.
	 *
	 * @param [function] setupCB? invoked right before execvp
	 * @return [Proc] the child process
	 */
	_launch: function(setupCB) {
		const pid = proc.fork();

		if (pid === 0) {
			try {
				if (setupCB) {
					setupCB();
				}

				if (this._dir) {
					proc.chdir(this._dir);
				}

				proc.execvp(this.argv[0], this.argv, this._env);
			} catch(err) {
				proc.exit(err.errno);
			}
			// execution ends here
		} else {
			// Store child pid for parent
			this.pid = pid;
		}

		return this;
	},
}

return Proc;
