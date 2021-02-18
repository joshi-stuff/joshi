const io = require('io');
const proc = require('proc');
const term = require('term');

const println = term.println;

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
		const result = this.launch().wait();

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
		this._err = where;

		return this;
	},

	in: function(where) {
		this._in = where;

		return this;
	},

	/**
	 * Launch the process without waiting for it.
	 *
	 * @param [function] setupCB? invoked after fork and before execvp
	 * @return [Proc] the child process
	 */
	launch: function(setupCB) {
		const pid = proc.fork();

		if (pid === 0) {
			if (setupCB) {
				setupCB();
			}

			this._setupIn();
			this._setupOut();
			this._setupErr();
			this._setupRedirs();

			proc.execvp(this.argv[0], this.argv);
			// execution ends here
		} else {
			// Store child pid for parent
			this.pid = pid;
		}

		return this;
	},

	out: function(where) {
		this._out = where;

		return this;
	},

	outErr: function(where) {
		this._out = where;
		this._err = 1;

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
		return 'Proc{"' + this.argv.join(' ')+ '", pid: ' + this.pid + '}';
	},

	/**
	 *
	 * @param [number] fd?
	 * The fd to divert connect to `where`. If omitted, fd 1 is used.
	 * 
	 * @param [number|string|Proc|HereString] where?
	 * A fd number, file path, Proc, or HereString to connect the fd to.
	 */
//	pipe: function(fd, where) {
//		if (where === undefined) {
//			where = fd;
//			fd = 1;
//		}
//
//		this._pipe[fd] = where;
//		return this;
//	},

	/**
	 * Wait for process to finish.
	 */
	wait: function() {
		// TODO: this needs to wait for all children, but we don't have 'em
		// because their handles have been lost after exec in children processes
		// we only have the pid of the top forked child.
		return proc.waitpid(this.pid);
	},

	_setupErr: function() {
	},

	_setupIn: function() {
		const where = this._in;

		if (where === undefined) {
			return;
		}

		if (where.is_a === 'HereString') {
			// TODO: in HereString
			throw new Error('Piping from HereStrings not yet supported');
		} 

		if (typeof where === 'string') {
			io.dup(io.open(where), 0);

			return this;
		} 

		if (typeof where === 'number') {
			io.dup(where, 0);

			return this;
		}

		if (where.is_a === 'Proc') {
			throw new Error(
				'Reading from a Proc is not supported: invert the relation ' +
					'and make the child Proc dump its output to the parent');
		} 
	},

	_setupOut: function() {
		const where = this._out;

		if (where === undefined) {
			return;
		}

		if (where.is_a === 'Proc') {
			const p = io.pipe().fildes;

			where.launch(function() {
				io.close(p[1]);
				io.dup2(p[0], 0);
				io.close(p[0]);
			});

			io.close(p[0]);
			io.dup2(p[1], 1);
			io.close(p[1]);

			return;
		} 

		if (typeof where === 'string') {
			// TODO: handle append with some flag, shell object, ...
			io.dup(io.trunc(where), 1);

			return;
		} 

		if (typeof where === 'number') {
			io.dup(where, 1);

			return;
		}

		if (where.is_a === 'HereString') {
			throw new Error('Sending output to a HereString is not possible');
		} 
	},

	_setupRedirs: function() {
		const fds = Object.keys(this._redir);

		for (var i = 0; i < fds.length; i++ ) {
			const fd = fds[i];
			const where = this._pipe[fd];

			var fdTo;

			if (where.is_a === 'Proc') {
				throw new Error('Piping to Procs not yet supported');
			} else if (where.is_a === 'HereString') {
				throw new Error('Piping from HereStrings not yet supported');
			} if (typeof where === 'string') {
				fdTo = io.truncate(where);
			} else if (typeof where === 'number') {
				fdTo = where;
			}

			println(this.argv, fdTo, '->', fd);
			io.dup2(fdTo, fd);
		}
	},
}

return $;
