const errno = require('errno');
const io = require('io');

const proc = {};

const atexit_handlers = [];

j.atexit(function() {
	for (var i = atexit_handlers.length - 1; i >= 0; i--) {
		const desc = atexit_handlers[i];

		if (desc.pid && desc.pid !== proc.getpid()) {
			continue;
		}

		desc.handler();
	}
});

/* Signal numbers */
proc.SIGHUP = 1;
proc.SIGINT = 2
proc.SIGQUIT = 3
proc.SIGILL = 4;
proc.SIGTRAP = 5;
proc.SIGABRT = 6;
proc.SIGIOT = 6;
proc.SIGBUS = 7;
proc.SIGFPE = 8;
proc.SIGKILL = 9;
proc.SIGUSR1 = 10;
proc.SIGSEGV = 11;
proc.SIGUSR2 = 12;
proc.SIGPIPE = 13;
proc.SIGALRM = 14;
proc.SIGTERM = 15;
proc.SIGSTKFLT = 16;
proc.SIGCHLD = 17;
proc.SIGCONT = 18;
proc.SIGSTOP = 19;
proc.SIGTSTP = 20;
proc.SIGTTIN = 21;
proc.SIGTTOU = 22;
proc.SIGURG = 23;
proc.SIGXCPU = 24;
proc.SIGXFSZ = 25;
proc.SIGVTALRM = 26;
proc.SIGPROF = 27;
proc.SIGWINCH = 28;
proc.SIGIO = 29;
proc.SIGPOLL = proc.SIGIO;
proc.SIGPWR = 30;
proc.SIGSYS = 31;
proc.SIGUNUSED = 31;

/* Wait option flags */
proc.WNOHANG = 1;
proc.WUNTRACED = 2;
proc.WCONTINUED = 8;

proc.alarm = function(seconds) {
	return j.alarm(seconds);
}

/**
 * Register function handlers for the exit process event.
 *
 * Note that, unlike the libc atexit() function, this one only invokes handlers
 * which have been registered for the current process, and not its children.
 *
 * In libc's atexit(), all handlers are inherited when a fork() is done, leading
 * to children process to execute atexit() handlers too. In this framework, the 
 * default is not to inherit unless requested with the first parameter set to
 * `true`.
 *
 * @param [boolean] inherit? whether to inherit the handler in forked children
 * @param [function] fn handler function
 */
proc.atexit = function(inherit, fn) {
	if (fn === undefined) {
		fn = inherit;
		inherit = false;
	}

	const pid = inherit ? undefined : proc.getpid();

	atexit_handlers.push({
		handler: fn,
		pid: pid 
	});
}

proc.chdir = function(dir) {
	return j.chdir(dir);
}

function invoke_exec(execfn, pathname, argv, env) {
	env = env || {};

	argv = argv.slice(0).map(function(arg) {
		return arg.toString();
	});
	argv.push(null);

	Object.entries(env).forEach(function(entry) {
		const name = entry[0];
		const value = entry[1];

		if (value !== null) {
			proc.setenv(name, value);
		} else {
			proc.unsetenv(name);
		}
	});

	try {
		return execfn(pathname, argv);
	}
	catch(err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
}

proc.execv = function(pathname, argv, env) {
	return invoke_exec(j.execv, pathname, argv, env);
}

proc.execvp = function(file, argv, env) {
	return invoke_exec(j.execvp, file, argv, env);
}

proc.exit = function(status) {
	j.exit(status);
}

/**
 * @param [boolean] wait?
 * @param [function] fn?
 * @return [{
 *   value:number, 
 *   exit_status:number, 
 *   signaled: boolean, 
 *   term_signal: number,
 *   core_dump: boolean, 
 *   stopped: boolean, 
 *   stop_signal: number,
 *   continued: boolean
 * }] 
 * If `wait` is `true` returns the exit description, otherwise, the child pid.
 */
proc.fork = function(wait, fn) {
	if (wait && fn === undefined) {
		fn = wait;
		wait = false;
	}

	const pid = j.fork();

	if (pid === 0) {
		if (fn) {
			try {
				fn();
			} 
			catch(err) {
				io.write_line(2, err.stack);
				proc.exit(err.errno || 1);
			}

			proc.exit(0);
		}
		else {
			return pid;
		}
	}

	if (wait) {
		return proc.waitpid(pid);
	}

	return pid;
}

/**
 *
 * @return [string|null]
 */
proc.getenv = function(name) {
	return j.getenv(name);
}

proc.getegid = function() {
	return j.getegid();
}

proc.geteuid = function() {
	return j.geteuid();
}

proc.getgid = function() {
	return j.getgid();
}

proc.getpid = function() {
	return j.getpid();
}

proc.getuid = function() {
	return j.getuid();
}

proc.kill = function(pid, sig) {
	if (sig === undefined) {
		sig = proc.SIGKILL;
	}

	return j.kill(pid, sig);
}

/**
 * Creates two pipes and wires them so that parent and child can talk to each 
 * other.
 *
 * @param [{}|undefined] wire
 * An object with `child` and `parent` properties and `in` and `out` and `err`
 * subproperties that specifies standard inputs and outputs to be wired to the 
 * pipe.
 *
 * Note that any wired standard fd is lost.
 *
 * @return [{pid: number, in: number, out: number, child|parent: true}]
 * An object where `in` and `out` are the corresponding pipe fds (for child and 
 * parent).
 */
proc.pipe_fork = function(wire) {
	wire = wire || {};
	wire.parent = wire.parent || {};
	wire.child = wire.child || {};

	const p2c = io.pipe();
	const c2p = io.pipe();

	const pid = proc.fork();
	var read_fd;
	var write_fd;

	if (pid !== 0) {
		io.close(p2c[0]);
		io.close(c2p[1]);

		read_fd = c2p[0];
		write_fd = p2c[1];

		wire = wire.parent;
	} else {
		io.close(p2c[1]);
		io.close(c2p[0]);

		read_fd = p2c[0];
		write_fd = c2p[1];

		wire = wire.child;
	}

	if (wire.in) {
		io.dup2(read_fd, 0);
	}

	if (wire.out) {
		io.dup2(write_fd, 1);
	}

	if (wire.err) {
		io.dup2(write_fd, 2);
	}

	return  {
		pid,
		in: read_fd,
		out: write_fd,
		child: pid === 0,
		parent: pid !== 0
	};
}

proc.safe_kill = function(pid, sig) {
	try {
		return proc.kill(pid, sig);
	}
	catch(err) {
		if (err.errno !== errno.ESRCH) {
			throw err;
		}
	}
}

proc.setenv = function(name, value, overwrite) {
	if (overwrite === undefined) {
		overwrite = 1;
	} else if (overwrite) {
		overwrite = 1;
	} else {
		overwrite = 0;
	}

	return j.setenv(name.toString(), value.toString(), overwrite);
}

proc.setsid = function() {
	return j.setsid();
}

/**
 *
 * @param [undefined|null|function] func
 * If a function is given it is registered as the signal handler.
 * If `null` is given the signal is ignored.
 * If `undefined` the default signal handler is installed.
 */
proc.signal = function(sig, func) {
	j.signal(sig, func);
}

proc.sleep = function(seconds) {
	while (seconds > 0) {
		seconds = j.sleep(seconds);
	}
}

/**
 * Launches a new detached child process. The child is detached calling 
 * proc.fork() twice so that it is unnecessary/impossible to wait for its 
 * termination.
 *
 * @param [string|function] fileOrFunction 
 * An executable file path or a function with the code to execute. Note that if
 * you pass a function the following parameters are ignored.
 *
 * @param [string[]] argv 
 * The standard argv vector to pass to the child. Note that position 0 should be 
 * the name of executable.
 *
 * @param [{[name:string}:string] environment variable for child process
 */
proc.spawn = function(fileOrFunction, argv, env) {
	var fn = fileOrFunction;
	
	if (typeof fileOrFunction === 'string') {
		fn = function() {
			proc.execv(fileOrFunction, argv, env);
		}
	}

	var pid = proc.fork();

	if (pid === 0) {
		pid = proc.fork();

		if (pid === 0) {
			try {
				fn();	
				proc.exit(0);
			}
			catch(err) {
				io.write_line(2, err.stack);
				proc.exit(err.errno || -1);
			}
		}

		proc.exit(0);
	}

	proc.waitpid(pid);
}

/**
 * This is like proc.spawn(), but it searches for the program in the PATH.
 *
 * @see proc.spawn()
 */
proc.spawnp = function(file, argv, env) {
	proc.spawn(function() {
		proc.execvp(file, argv, env);
	});
}

proc.unsetenv = function(name) {
	return j.unsetenv(name);
}

/**
 *
 * @param [number] options
 * @return [{
 *   value: number, 
 *   exit_status: number,
 *   signaled: boolean,
 *   term_signal: number,
 *   core_dump: boolean,
 *   stopped: boolean,
 *   stop_signal: number,
 *   continued: boolean
 * }]
 */
proc.waitpid = function(pid, options) {
	if (options === undefined) {
		options = 0;
	}

	const result = j.waitpid(pid, options);

	const wstatus = result.wstatus;

	return {
		value: result.value,
		exit_status: (wstatus & 0xFF00) >> 8,
		signaled: ((wstatus & 0x7F) >> 1) > 0,
		term_signal: wstatus & 0x7F,
		core_dump: (wstatus & 0x80) != 0,
		stopped: (wstatus & 0xFF) == 0x7F,
		stop_signal: (wstatus & 0xFF00) >> 8,
		continued: wstatus == 0xFFFF,
	};
}

return proc;
