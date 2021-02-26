const errno = require('errno');
const io = require('io');

const proc = {};

const atexit_handlers = [];

j.atexit(function() {
	for (var i = atexit_handlers.length - 1; i >= 0; i--) {
		atexit_handlers[i]();
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

proc.atexit = function(fn) {
	atexit_handlers.push(fn);
}

proc.chdir = function(dir) {
	return j.chdir(dir);
}

proc.execv = function(pathname, argv, env) {
	env = env || {};

	argv = argv.slice(0);
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
		return j.execv(pathname, argv);
	}
	catch(err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
}

proc.execvp = function(file, argv, env) {
	env = env || {};

	argv = argv.slice(0);
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
		return j.execvp(file, argv);
	}
	catch(err) {
		err.message += ' (' + file + ')';
		throw err;
	}
}

proc.exit = function(status) {
	j.exit(status);
}

proc.fork = function() {
	return j.fork();
}

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

	const p2c = io.pipe().fildes;
	const c2p = io.pipe().fildes;

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

proc.spawn = function(file, argv, env) {
	const pid = proc.fork();

	if (pid === 0) {
		try {
			proc.execv(file, argv, env);
		}
		catch(err) {
			io.write_line(2, err.toString());
			proc.exit(err.errno || -1);
		}
	}

	return pid;
}

proc.spawnp = function(file, argv, env) {
	const pid = proc.fork();

	if (pid === 0) {
		try {
			proc.execvp(file, argv, env);
		}
		catch(err) {
			io.write_line(2, err.toString());
			proc.exit(err.errno || -1);
		}
	}

	return pid;
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
