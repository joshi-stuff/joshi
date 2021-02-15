const io = require('io');

const proc = {};

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

proc.alarm = function(seconds) {
	return j.alarm(seconds);
}

proc.execv = function(pathname, argv) {
	return j.execv(pathname, argv);
}

proc.execvp = function(file, argv) {
	return j.execvp(file, argv);
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
		child: pid ===0,
		parent: pid !== 0
	};
}

proc.fork = function() {
	return j.fork();
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


return proc;
