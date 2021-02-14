return {
	includes: [
		'fcntl.h',
//		'poll.h',
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
			{ 'int': 'seconds' },
			{ returns: 'unsigned', throws: false }
		],

		'close': [
			{ 'int': 'fd' },
			{ returns: 'int' }
		],

		'dup': [
			{ 'int': 'fildes' },
			{ returns: 'int' }
		],

		'dup2': [
			{ 'int': 'fildes' },
			{ 'int': 'fildes2' },
			{ returns: 'int' }
		],

		'exit': [
			{ 'int': 'status' },
			{ returns: 'void' }
		],

		'fork': [
			{ returns: 'pid_t' }
		],

		'open': [
			{ 'char*': 'pathname' },
			{ 'int': 'flags' },
			{ returns: 'int' }
		],

		'pipe': [
			{ 'int[]': 'fildes', ref: true, size: '2' },
			{ returns: 'int' }
		],

		/*
		'poll': [
			{ 'struct pollfd*': 'fds'},
			{ 'nfds_t': 'nfds' },
			{ 'int': 'timeout' },
			{ returns: 'int' }
		],
		*/

		'read': [
			{ 'int': 'fd' },
			{ 'void*': 'buf' },
			{ 'size_t': 'count' },
			{ returns: 'ssize_t' },
		],

		'waitpid': [
			{ 'pid_t': 'pid' },
			{ 'int': 'wstatus', ref: true },
			{ 'int': 'options' },
			{ returns: 'pid_t' }
		],

		'write': [
			{ 'int': 'fd' },
			{ 'void*': 'buf' },
			{ 'size_t': 'count' },
			{ returns: 'ssize_t' }
		],

		// TODO: execv and execvp builtin
		// TODO: ioctl
		// TODO: kill builtin
		// TODO: seek builtin
		// TODO: tell builtin
		// TODO: execvpe builtin ?
	}
};


