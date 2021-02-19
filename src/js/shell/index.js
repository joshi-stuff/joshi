const fs = require('fs');
const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;
const println2 = term.println2;

const parse = require('./parse.js');

// TODO: maybe use URLs for HereStrings, append, ... instead of wrappers (assume file://)
// TODO: $.here(string) returns a HereString that can be parsed by asFd
// TODO: $.capture(obj) captures output of a fd and puts it under 'capture' field of obj

/*
 *
 * @param [string|...string|string[]]
 */
function $() {
	return new Proc(parse.asArgv(arguments));
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

function Proc(argv) {
	this.is_a = 'Proc';
	this.argv = argv;

	this._in = undefined;
	this._out = undefined;
	this._err = undefined;
	this._redir = {};
}

Proc.prototype = {

	/**
	 * Execute a full execution graph and wait for it to exit.
	 */
	do: function() {
		// Collect piped Procs
		const pipedProcs = this._collectProcPipes();

		// Compute all Procs
		const procsToLaunch = [this];

		for (var i = 0; i < pipedProcs.length; i++) {
			procsToLaunch.push(pipedProcs[i].to);
		}

		// Check if Proc commands exist
		for (var i = 0; i < procsToLaunch.length; i++) {
			const proc = procsToLaunch[i];

			if ($.search_path(proc.argv[0]) === null) {
				throw new Error('Command not found: ' + proc.argv[0]);
			}
		}


		// Connect Procs
		const pipes = [];

		for (var i = 0; i < pipedProcs.length; i++) {
			const pipedProc = pipedProcs[i];
			const pipe = io.pipe().fildes;

			pipedProc.from._redir[1] = pipe[1];
			pipedProc.to._redir[0] = pipe[0];

			pipes.push(pipe);
		}

		// Launch the Procs
		for (var i = 0; i < procsToLaunch.length; i++) {
			const proc = procsToLaunch[i];

			proc._launch(function() {
				// Close all pipes but the ones this process uses
				for (var j = 0; j < pipes.length; j++) {
					if (j !== i && j !== i-1) {
						io.close(pipes[j][0]);
						io.close(pipes[j][1]);
					}
				}

				// Close the endpoints of the used pipes that we don't use
				if (i === 0) {
					io.close(pipes[0][0]);
				} else if(i === pipes.length) {
					io.close(pipes[pipes.length-1][1]);
				} else {
					io.close(pipes[i-1][1]);
					io.close(pipes[i][0]);
				}
			});
		}

		// Close all pipes in the shell process
		for (var i = 0; i < pipes.length; i++) {
			const pipe = pipes[i];

			io.close(pipe[0]);
			io.close(pipe[1]);
		}

		// Wait for parent Procs to finish
		for (var i = 0; i < procsToLaunch.length - 1; i++) {
			procsToLaunch[i].wait();
		}

		// Get the result from the last child
		const result = procsToLaunch[procsToLaunch.length - 1].wait();

		// TODO: move this to the real shell
		term.fg(0xD0, 0x80, 0x80);
		if (result.exit_status != 0) {
			println('Command exited with code:', result.exit_status);
		} else if (result.signaled) {
			println('Command received signal:', result.signaled);
		} else if (result.core_dump) {
			println('Command core dumped');
		}
		term.reset();
	},

	// TODO: capture, captureErr, captureAll

	err: function(where) {
		if (where.is_a === 'Proc') {
			this._err = where;
		} else {
			this._redir[2] = where;
		}

		return this;
	},

	in: function(where) {
		if (where.is_a === 'Proc') {
			this._in = where;
		} else {
			this._redir[0] = where;
		}

		return this;
	},

	out: function(where) {
		if (where.is_a === 'Proc') {
			this._out = where;
		} else {
			this._redir[1] = where;
		}

		return this;
	},

	outErr: function(where) {
		this.out(where);
		this.err(1);

		return this;
	},

	redir: function(fd, where) {
		if (fd === 0 || fd === 1 || fd === 2) {
			throw new Error(
				'Do not use redir for standard fds, use a specific function');
		}

		if (where.is_a === 'Proc') {
			throw new Error('Redirecting to a Proc is not supported');
		} 

		this._redir[fd] = where;

		return this;
	},

	toString: function() {
		return 'Proc{' + 
			'"' + this.argv.join(' ') + '"' +
			(this.pid 
				? (', pid: ' + this.pid)
				: '') +
			(Object.keys(this._redir).length 
				? (', redirs: ' + term._toString(this._redir))
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

	_collectProcPipes: function() {
		const procPipes = [];
		
		const out = this._out;

		if (out && out.is_a === 'Proc') {
			procPipes.push({
				from: this, 
				to: out
			});

			procPipes = procPipes.concat(out._collectProcPipes());
		}

		const err = this._err;

		if (err && err.is_a === 'Proc') {
			procPipes.push({
				from: this, 
				to: err
			});

			procPipes = procPipes.concat(err._collectProcPipes());
		}

		return procPipes;
	},

	/**
	 * Launch the process without waiting for it.
	 *
	 * @param [function] setupCB? invoked right before execvp
	 * @return [Proc] the child process
	 */
	_launch: function(setupCB) {
		const command = $.search_path(this.argv[0]);

		if (command === null) {
			throw new Error('Command not found: ' + this.argv[0]);
		}

		const pid = proc.fork();

		if (pid === 0) {
			try {
				this._setupRedirs();

				if (setupCB) {
					setupCB();
				}

				proc.execvp(this.argv[0], this.argv);
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

	_setupRedirs: function() {
		const fds = Object.keys(this._redir);

		for (var i = 0; i < fds.length; i++ ) {
			const fd = fds[i];
			const where = this._redir[fd];

			var fdTo;

			if (where.is_a === 'Proc') {
				throw new Error('Redirecting to Procs it not supported');
			} else if (where.is_a === 'HereString') {
				if (fd === 1 || fd === 2) {
					throw new Error(
						'Standard outputs cannot be redirected to HereStrings');
				}

				throw new Error(
					'Redirecting from HereStrings not yet supported');
			} if (typeof where === 'string') {
				if (fd === 0) {
					fdTo = io.open(where);
				} else if (fd === 1 || fd ===2) {
					// TODO: support appending
					fdTo = io.truncate(where);
				} else {
					// TODO: what to do here? how to open?
					throw new Error(
						'Non standard fds cannot be redirected to files');
				}
			} else if (typeof where === 'number') {
				fdTo = where;
			}

			io.dup2(fdTo, fd);
		}
	},
}

return $;
