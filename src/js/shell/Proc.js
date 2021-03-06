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

			// Collect capture fds
			const captures = this._collectCaptures();
			const captureFds = {};
			
			for (var i = 0; i < captures.length; i++) {
				captures[i].sources.forEach(function(source){ 
					captureFds[source.fd] = true;
				});
			}

			// Close open fds in parent except those to be used after execution
			for (var i = 0; i < openFds.length; i++) {
				const fd = openFds[i];

				if (!captureFds[fd]) {
					io.close(fd);
				}
			}

			// Wait for parent Procs to finish and get result from last child
			const last = childProcs.length - 1;

			for (var i = 0; i < last; i++) {
				childProcs[i].wait();
			}

			const result = childProcs[last].wait();

			// Close captures after execution
			for (var i = 0; i < captures.length; i++) {
				captures[i].close();
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
	 * @param [Proc|Capture|number] where
	 */
	pipe: function(fds, where) {
		if (where === undefined) {
			where = fds;
			fds = [1];
		}

		if (!Array.isArray(fds)) {
			fds = [fds];
		}

		if (where.is_a === 'Proc') {
			// Redirect first fd to where
			this._pipe[fds[0]] = where;

			// Redirect rest of fds to first fd
			for (var i = 1; i < fds.length; i++) {
				this._pipe[fds[i]] = fds[0];
			}
		}
		else {
			for (var i = 0; i < fds.length; i++) {
				this._pipe[fds[i]] = where;
			}
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

	_collectCaptures: function() {
		const captures = [];

		const fds = Object.keys(this._pipe);

		for (var i = 0; i < fds.length; i++) {
			const fd = fds[i];
			const where = this._pipe[fd];

			if (where.is_a === 'Capture') {
				if (!captures.includes(where)) {
					captures.push(where);
				}
			}
			else if (where.is_a === 'Proc' ) {
				captures = captures.concat(where._collectCaptures());
			}
		}

		return captures;
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
				} else if (where.is_a === 'Capture') {
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
