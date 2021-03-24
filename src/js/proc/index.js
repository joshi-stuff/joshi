const errno = require('errno');
const io = require('io');

/**
 * A registered atexit() handler
 *
 * @typedef {object} AtexitHandler
 *
 * @property {number} [pid] 
 * Process from which handler must be invoked. Or all processes if missing.
 *
 * @property {function} handler 
 * The handler function to invoke
 *
 * @private
 */

/**
 * Process execution options.
 *
 * @typedef {object} ProcExecOptions
 *
 * @property {string} dir New working directory for new process
 *
 * @property {object} env
 * Environment variables to add/override for new process. Setting a variable to 
 * `null` removes it.
 * 
 * @property {boolean} search_path
 * Whether to search executable in PATH (default is `true`)
 */

/**
 * Information on a process execution result.
 *
 * @typedef {object} ProcResult
 *
 * @property {number} value
 * The child pid
 *
 * @property {number|undefined} exit_status
 * The exit status (a number between 0 and 255) or undefined if the process
 * exited because of a signal
 *
 * @property {number|undefined} term_signal
 * The termination signal or undefined if the process exited normally
 *
 * @property {number|undefined} stop_signal
 * The stop signal if the process was stopped
 *
 * @property {boolean} core_dump
 *
 * @property {boolean} continued
 */

/** 
 * @exports proc 
 * @readonly
 * @enum {number}
 */
const proc = {
	SIGHUP: 1,
	SIGINT: 2,
	SIGQUIT: 3,
	SIGILL: 4,
	SIGTRAP: 5,
	SIGABRT: 6,
	SIGIOT: 6,
	SIGBUS: 7,
	SIGFPE: 8,
	SIGKILL: 9,
	SIGUSR1: 10,
	SIGSEGV: 11,
	SIGUSR2: 12,
	SIGPIPE: 13,
	SIGALRM: 14,
	SIGTERM: 15,
	SIGSTKFLT: 16,
	SIGCHLD: 17,
	SIGCONT: 18,
	SIGSTOP: 19,
	SIGTSTP: 20,
	SIGTTIN: 21,
	SIGTTOU: 22,
	SIGURG: 23,
	SIGXCPU: 24,
	SIGXFSZ: 25,
	SIGVTALRM: 26,
	SIGPROF: 27,
	SIGWINCH: 28,
	SIGIO: 29,
	SIGPOLL: 29,
	SIGPWR: 30,
	SIGSYS: 31,
	SIGUNUSED: 31,

	/** Return immediately if no child has exited */
	WNOHANG: 1,
	/** Also return if a child has stopped (but not traced via ptrace(2)) */
	WUNTRACED: 2,
	/** 
	 * Also return if a stopped child has been resumed by delivery of SIGCONT
	 * (since Linux 2.6.10)
	 */
	WCONTINUED: 8,
};

/**
 * atexit() handlers store
 *
 * @type {AtexitHandler[]}
 * @private
 */
const atexit_handlers = [];

/* Register our own handler with libc runtime */
j.atexit(function() {
	for (var i = atexit_handlers.length - 1; i >= 0; i--) {
		const desc = atexit_handlers[i];

		if (desc.pid && desc.pid !== proc.getpid()) {
			continue;
		}

		desc.handler();
	}
});

/**
 * The alarm() function shall cause the system to generate a SIGALRM signal for 
 * the process after the number of realtime seconds specified by seconds have
 * elapsed.
 *
 * Processor scheduling delays may prevent the process from handling the signal
 * as soon as it is generated.
 *
 * If seconds is 0, a pending alarm request, if any, is canceled.
 *
 * Alarm requests are not stacked; only one SIGALRM generation can be scheduled
 * in this manner. If the SIGALRM signal has not yet been generated, the call 
 * shall result in rescheduling the time at which the SIGALRM signal is
 * generated.
 *
 * @param {number} seconds
 *
 * @returns {number}
 * If there is a previous alarm() request with time remaining, alarm() shall
 * return a non-zero value that is the number of seconds until the previous 
 * request would have generated a SIGALRM signal.
 *
 * Otherwise, alarm() shall return 0.
 */
proc.alarm = function(seconds) {
	return j.alarm(Number(seconds));
}

/**
 * Register function handlers for the exit process event.
 *
 * Note that, unlike the libc atexit() function, this one only invokes handlers
 * which have been registered for the current process, and not its children.
 *
 * In libc's atexit(), all handlers are inherited when a fork() is done, leading
 * to children process to execute atexit() handlers too. In this framework, the 
 * default is not to inherit unless requested with `inherit = true`.
 *
 * @param {boolean} [inherit=false] 
 * Whether to inherit the handler in forked children
 *
 * @param {function} fn 
 * Handler function
 *
 * @returns {void}
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

/**
 * Change process working directory.
 *
 * @returns {number} 0
 * @throws {SysError} 
 */
proc.chdir = function(dir) {
	return j.chdir(dir);
}

/**
 * Replace the current process image with a new process image.
 *
 * Note that this function either fails or doesn't return ever because it
 * replaces the current process image.
 *
 * @param {string} executable Path or name of executable
 * 
 * @param {string[]} [args=[]]
 * Array of arguments to pass to program (not including argv[0]).
 * 
 * @param {ProcExecOptions} [opts={}]
 * Options for process execution.
 *
 * @throws {SysError} 
 */
proc.exec = function(executable, args, opts) {
	if (!Array.isArray(args)) {
		opts = args;
		args = [];
	}

	args = args || [];
	opts = opts || {};

	const argv = [executable].concat(args).map(function(arg) {
		return arg.toString();
	});
	argv.push(null);

	if (opts.dir) {
		proc.chdir(opts.dir);
	}

	if (opts.env) {
		Object.entries(opts.env).forEach(function(entry) {
			const name = entry[0];
			const value = entry[1];

			if (value !== null) {
				proc.setenv(name, value);
			} else {
				proc.unsetenv(name);
			}
		});
	}

	try {
		if (opts.search_path !== false) {
			j.execvp(executable, argv);
		} 
		else {
			j.execv(executable, argv);
		}

		proc.exit(-1);
	}
	catch(err) {
		err.message += ' (' + executable + ')';
		throw err;
	}
}

/** 
 * End current process returning given status code.
 *
 * Note that this function doesn't return ever because it finishes the process.
 * 
 * @param {number} [status=0] Status code to return to kernel
 */ 
proc.exit = function(status) {
	status = Number(status || 0);

	j.exit(status);
}

/**
 * This function creates a new process.
 *
 * @example
 * // Fork and return immediately (old school fork)
 * const pid = proc.fork();
 * if (pid === 0) {
 *   // Run child code
 *   ...
 * } else {
 *   // Run parent code
 *   ...
 *
 *   // Wait for child to finish
 *   proc.waitpid(pid);
 * }
 *
 * @example
 * const pid = proc.fork(function() {
 *   // Run child code
 *   ...
 * });
 *
 * // Wait for child to finish
 * proc.waitpid(pid);
 *
 * @example
 * const result = proc.fork(true, function() {
 *   // Run child code
 *   ...
 * });
 *
 * // Check result
 * if (result.exit_status !== 0) {
 *   ...
 * }
 *
 * @param {true} [wait] 
 * Pass `true` to wait for child to finish. Can only be given if `fn` is given 
 * since it doesn't make sense to wait for an empty child.
 *
 * @param {function} [fn]
 * The function that implements the child process. If not given, the method 
 * returns and the return code must be inspected to decide whether to execute
 * parent or child code.
 *
 * @returns {number|ProcResult}
 * If `wait` is `true` returns the result of proc.waitpid(), otherwise, the 
 * return value is 0 in the child and the pid of the child in the parent.
 *
 * @throws {SysError} 
 */
proc.fork = function(wait, fn) {
	if (typeof wait === 'function') {
		fn = wait;
		wait = false;
	} 
	else {
		wait = !!wait;
	}

	if (wait && fn === undefined) {
		throw new Error('Cannot wait on a fork with no function to execute');
	}

	const pid = j.fork();

	if (pid === 0) {
		if (fn) {
			try {
				fn();
			} 
			catch(err) {
				io.write_string(2, err.stack + '\n');
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
 * Double fork idiom used to launch detached (daemonized) processes. Note that
 * it has builtin support to obtain the child pid if requested.
 *
 * @example
 * proc.fork2(function() {
 *   // Run fire and forget daemon
 *   ...
 * });
 *
 * @example
 * const pid = proc.fork2(true, function() {
 *   // Run managed daemon
 *   ...
 * });
 *
 * ...
 *
 * // Kill daemon
 * proc.kill(pid);
 *
 * @param {true} [getpid] Pass `true` to make the function return daemon's pid
 * @param {function} fn The function that implements daemon's code
 * @returns {void|number} pid of daemon if `getpid = true`
 * @throws {SysError} 
 */
proc.fork2 = function(getpid, fn) {
	if (typeof getpid === 'function') {
		fn = getpid;
		getpid = false;
	}
	else {
		getpid = !!getpid;
	}

	if (fn === undefined) {
		throw new Error('Cannot launch a daemon with no function to execute');
	}

	var fds;

	if (getpid) {
		fds = io.pipe();
	}

	var pid = proc.fork();

	if (pid === 0) {
		pid = proc.fork();

		if (pid === 0) {
			if (getpid) {
				io.close(fds[0]);
				io.write_string(fds[1], proc.getpid());
				io.close(fds[1]);
			}

			try {
				fn();	
				proc.exit(0);
			}
			catch(err) {
				io.write_line(2, err.stack);
				proc.exit(err.errno === undefined ? -1 : err.errno);
			}
		}

		proc.exit(0);
	}

	var child_pid = undefined;

	if (getpid) {
		io.close(fds[1]);
		child_pid = Number(io.read_string(fds[0]));
		io.close(fds[0]);
	}

	return child_pid;
}

/**
 * Get the value of an environment variable
 *
 * @param {string} name The name of the environment variable
 * @returns {string|null} The value of the environment variable
 */
proc.getenv = function(name) {
	return j.getenv(name);
}

/**
 * Get the effective group id of the running process.
 *
 * @returns {number} A group id
 */
proc.getegid = function() {
	return j.getegid();
}

/**
 * Get the effective user id of the running process.
 *
 * @returns {number} A user id
 */
proc.geteuid = function() {
	return j.geteuid();
}

/**
 * Get the group id of the running process.
 *
 * @returns {number} A group id
 */
proc.getgid = function() {
	return j.getgid();
}

/**
 * Get the pid of the running process.
 *
 * @returns {number} A process id
 */
proc.getpid = function() {
	return j.getpid();
}

/**
 * Get the pid of the parent process.
 *
 * @returns {number} A process id
 */
proc.getppid = function() {
	return j.getppid();
}

/**
 * Get the user id of the running process.
 *
 * @returns {number} A user id
 */
proc.getuid = function() {
	return j.getuid();
}

/**
 * The kill() function can be used to send any signal to any process group or 
 * process.
 *
 * For a process to have permission to send a signal, it must either be
 * privileged (under Linux: have the CAP_KILL capability in the user namespace
 * of the target process), or the real or effective user ID of the sending
 * process must equal the real or saved set-user-ID of the target process. In
 * the case of `SIGCONT`, it suffices when the sending and receiving processes
 * belong to the same session.
 *
 * @param {number} pid
 * If `pid` is positive, then signal `sig` is sent to the process with the ID 
 * specified by `pid`.
 *
 * If `pid` equals `0`, then `sig` is sent to every process in the process group 
 * of the calling process.
 *
 * If `pid` equals `-1`, then `sig` is sent to every process for which the 
 * calling process has permission to send signals, except for process `1`
 * (init), but see below.
 *
 * If `pid` is less than `-1`, then `sig` is sent to every process in the
 * process group whose ID is `-pid`.
 *
 * @param {number} sig
 * If `sig` is `0`, then no signal is sent, but existence and permission checks
 * are still performed; this can be used to check for the existence of a process 
 * ID or process group ID that the caller is permitted to signal.
 *
 * @returns {0}
 * @throws {SysError} 
 */
proc.kill = function(pid, sig) {
	if (sig === undefined) {
		sig = proc.SIGKILL;
	}

	return j.kill(pid, sig);
}

/**
 * Set an environment variable.
 *
 * @param {string} name Name of variable
 * @param {string|null} value Value to set or `null` to unset
 * @param {boolean} [overwrite=true] Whether to overwrite the value if it exists
 * @returns {0}
 * @throws SysError
 */
proc.setenv = function(name, value, overwrite) {
	name = name.toString();
	overwrite = overwrite === undefined ? true : !!overwrite;

	if (value === null) {
		if (!overwrite) {
			return 0;
		}

		return j.unsetenv(name);
	}

	return j.setenv(name, value.toString(), overwrite ? 1 : 0);
}

/**
 * Creates a new session if the calling process is not a process group leader.
 * The calling process is the leader of the new session (i.e., its session ID is
 * made the same as its process ID).
 *
 * The calling process also becomes the process group leader of a new process 
 * group in the session (i.e., its process group ID is made the same as its
 * process ID).
 *
 * The calling process will be the only process in the new process group and in
 * the new session.
 *
 * Initially, the new session has no controlling terminal. For details of how a
 * session acquires a controlling terminal, see credentials(7).
 *
 * @returns {number} The (new) session ID of the calling process
 * @throws SysError
 */
proc.setsid = function() {
	return j.setsid();
}

/**
 * The signal() function chooses one of three ways in which receipt of the
 * signal number `sig` is to be subsequently handled. 
 *
 * @param {number} sig The signal number
 *
 * @param {undefined|null|function} func
 * If the value of `func` is `undefined`, default handling for that signal shall
 * occur.
 *
 * If the value of `func` is `null`, the signal shall be ignored.
 *
 * Otherwise, the application shall ensure that `func` points to a function to
 * be called when that signal occurs.
 *
 * @returns {void}
 * @throws SysError
 */
proc.signal = function(sig, func) {
	j.signal(sig, func);
}

/**
 * Pause execution of the running process for a given number of seconds.
 *
 * @param {number} seconds Seconds to wait
 * @returns {0} 
 * @throws SysError
 */
proc.sleep = function(seconds) {
	while (seconds > 0) {
		seconds = j.sleep(seconds);
	}
}

/**
 * Delete an environment variable.
 *
 * @param {string} name Name of environment variable
 * @returns {0}
 * @throws SysError
 */
proc.unsetenv = function(name) {
	return j.unsetenv(name);
}

/**
 *
 * @param {number} pid
 * < -1 meaning wait for any child process whose process group ID is
 * equal to the absolute value of pid.
 *
 * -1 meaning wait for any child process.
 *
 * 0 meaning wait for any child process whose process group ID is equal to that
 * of the calling process at the time of the call to waitpid().
 *
 * &gt; 0 meaning wait for the child whose process ID is equal to the value of pid.
 *
 * @param {number} options 
 * Zero or an OR of proc.WNOHANG, proc.WUNTRACED, or proc.WCONTINUED.
 *
 * @return {ProcResult}
 * @throws SysError
 */
proc.waitpid = function(pid, options) {
	if (options === undefined) {
		options = 0;
	}

	const result = j.waitpid(pid, options);

	const wstatus = result.wstatus;

	const exit_status = (wstatus & 0xFF00) >> 8;
	const term_signal = wstatus & 0x7F;

	return {
		value: result.value,
		exit_status: term_signal === 0 ? exit_status : undefined,
		term_signal: term_signal === 0 ? undefined : term_signal,
		stop_signal: (wstatus & 0xFF) == 0x7F ? exit_status : undefined,
		core_dump: (wstatus & 0x80) != 0,
		continued: wstatus == 0xFFFF,
	};
}

return proc;
