return {
	includes: [
		'fcntl.h',
		'poll.h',
		'signal.h',
		'stdio.h',
		'string.h',
		'sys/stat.h',
		'sys/types.h',
		'sys/wait.h',
		'unistd.h'
	],
	syscalls: {
		'alarm': [
			{ type: 'int', name: 'seconds' },
			{ returns: 'unsigned', throws: false }
		],

		'close': [
			{ type: 'int', name: 'fd' },
			{ returns: 'int' }
		],

		'dup': [
			{ type: 'int', name: 'fildes' },
			{ returns: 'int' }
		],

		'dup2': [
			{ type: 'int', name: 'fildes' },
			{ type: 'int', name: 'fildes2' },
			{ returns: 'int' }
		],

		'execv': [
			{ type: 'char*', name: 'pathname' },
			{ type: 'char*[]', name: 'argv' },
			{ returns: 'int' }
		],

		'execvp': [
			{ type: 'char*', name: 'file' },
			{ type: 'char*[]', name: 'argv' },
			{ returns: 'int' }
		],

		'exit': [
			{ type: 'int', name: 'status' },
			{ returns: 'void' }
		],

		'fork': [
			{ returns: 'pid_t' }
		],

		'open': [
			{ type: 'char*', name: 'pathname' },
			{ type: 'int', name: 'flags' },
			{ returns: 'int' }
		],

		'pipe': [
			{ type: 'int[]', name: 'fildes', out: true, size: '2' },
			{ returns: 'int' }
		],

		'poll': [
			{ type: 'struct pollfd*', name: 'fds', in: true, out: true},
			{ type: 'nfds_t', name: 'nfds' },
			{ type: 'int', name: 'timeout' },
			{ returns: 'int' }
		],

		'read': [
			{ type: 'int', name: 'fd' },
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'count' },
			{ returns: 'ssize_t' },
		],

		'waitpid': [
			{ type: 'pid_t', name: 'pid' },
			{ type: 'int', name: 'wstatus', out: true },
			{ type: 'int', name: 'options' },
			{ returns: 'pid_t' }
		],

		'write': [
			{ type: 'int', name: 'fd' },
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'count' },
			{ returns: 'ssize_t' }
		],

		// TODO: ioctl
		// TODO: kill 
		// TODO: seek
		// TODO: tell
		// TODO: execvpe ?
	}
};


