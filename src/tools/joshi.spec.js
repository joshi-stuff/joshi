return {
	includes: [
		'dirent.h',
		'fcntl.h',
		'poll.h',
		'signal.h',
		'stdio.h',
		'string.h',
		'sys/random.h',
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

		'closedir': [
			{ type: 'DIR*', name: 'dirp' },
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

		'getegid': [
			{ returns: 'uid_t' }
		],

		'getenv': [
			{ type: 'char*', name: 'name' },
			{ returns: 'char*', throws: false }
		],

		'geteuid': [
			{ returns: 'uid_t' }
		],

		'getgid': [
			{ returns: 'uid_t' }
		],

		'getpid': [
			{ returns: 'pid_t' }
		],

		'getrandom': [
			{ type: 'void*', name: 'buf', size: 'buflen', in: true, out: true },
			{ type: 'size_t', name: 'buflen' },
			{ type: 'unsigned int', name: 'flags' },
			{ returns: 'ssize_t' }
		],

		'getuid': [
			{ returns: 'uid_t' }
		],

		'lseek': [
			{ type: 'int', name: 'fildes' },
			{ type: 'off_t', name: 'offset' },
			{ type: 'int', name: 'whence' },
			{ returns: 'off_t' }
		],

		'open': [
			{ type: 'char*', name: 'pathname' },
			{ type: 'int', name: 'flags' },
			{ type: 'mode_t', name: 'mode' },
			{ returns: 'int' }
		],

		'opendir': [
			{ type: 'char*', name: 'name' },
			{ returns: 'DIR*', throws: 'on null' }
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

		'readdir': [
			{ type: 'DIR*', name: 'dirp' },
			{ returns: 'struct dirent*', throws: 'on null'}
		],

		'sleep': [
			{ type: 'unsigned int', name: 'seconds' },
			{ returns: 'unsigned int' },
		],

		'stat': [
			{ type: 'char*', name: 'pathname'},
			{ type: 'struct stat*', name: 'statbuf', out: true},
			{ returns: 'int' }
		],

		'unlink': [
			{ type: 'char*', name: 'pathname'},
			{ returns: 'int' }
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
	}
};


