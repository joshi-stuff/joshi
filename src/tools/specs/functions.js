return {

	'alarm': {
		args: [
			{ type: 'int', name: 'seconds' },
		],
		returns: { type: 'unsigned' },
		throws: 'nothing'
	},

	'chdir': {
		args: [
			{ type: 'char*', name: 'path' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'close': {
		args: [
			{ type: 'int', name: 'fd' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'closedir': {
		args: [
			{ type: 'DIR*', name: 'dirp' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'crypt': {
		args: [
			{ type: 'char*', name: 'phrase' },
			{ type: 'char*', name: 'setting' },
		],
		returns: { type: 'char*' },
		throws: 'errno-alone'
	},

	'dup': {
		args: [
			{ type: 'int', name: 'fildes' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'dup2': {
		args: [
			{ type: 'int', name: 'fildes' },
			{ type: 'int', name: 'fildes2' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'execv': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'char*[]', name: 'argv' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'execvp': {
		args: [
			{ type: 'char*', name: 'file' },
			{ type: 'char*[]', name: 'argv' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'exit': {
		args: [
			{ type: 'int', name: 'status' },
		],
		returns: null,
		throws: 'nothing'
	},

	'fork': {
		args: [],
		returns: { type: 'pid_t' },
		throws: 'errno'
	},

	'getegid': {
		args: [],
		returns: { type: 'uid_t' },
		throws: 'errno'
	},

	'getenv': {
		args: [
			{ type: 'char*', name: 'name' },
		],
		returns: { type: 'char*' },
		throws: 'nothing'
	},

	'geteuid': {
		args: [],
		returns: { type: 'uid_t' },
		throws: 'errno'
	},

	'getgid': {
		args: [],
		returns: { type: 'uid_t' },
		throws: 'errno'
	},

	'getpid': {
		args: [],
		returns: { type: 'pid_t' },
		throws: 'errno'
	},

	'getppid': {
		args: [],
		returns: { type: 'pid_t' },
		throws: 'errno'
	},

	'getrandom': {
		args: [
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'buflen' },
			{ type: 'unsigned int', name: 'flags' },
		],
		returns: { type: 'ssize_t' },
		throws: 'errno'
	},

	'getuid': {
		args: [],
		returns: { type: 'uid_t' },
		throws: 'errno'
	},

	'kill': {
		args: [
			{ type: 'pid_t', name: 'pid' },
			{ type: 'int', name: 'sig' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'lseek': {
		args: [
			{ type: 'int', name: 'fildes' },
			{ type: 'off_t', name: 'offset' },
			{ type: 'int', name: 'whence' },
		],
		returns: { type: 'off_t' },
		throws: 'errno'
	},

	'lstat': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'struct stat', name: 'statbuf', ref: true, out: true },
		],
		returns: { type: 'int'},
		throws: 'errno'
	},

	'mkdir': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'mode_t', name: 'mode' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'mkfifo': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'mode_t', name: 'mode' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'open': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'int', name: 'flags' },
			{ type: 'mode_t', name: 'mode' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'opendir': {
		args: [
			{ type: 'char*', name: 'name' },
		],
		returns: { type: 'DIR*' }, 
		throws: 'errno-on-null' 
	},

	'pipe': {
		args: [
			{ type: 'int[]', name: 'fildes', in_out: true },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'poll': {
		args: [
			{ type: 'struct pollfd[]', name: 'fds', in_out: true },
			{ type: 'nfds_t', name: 'nfds' },
			{ type: 'int', name: 'timeout' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'read': {
		args: [
			{ type: 'int', name: 'fd' },
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'count' },
		],
		returns: { type: 'ssize_t' },
		throws: 'errno'
	},

	'readdir': {
		args: [
			{ type: 'DIR*', name: 'dirp' },
		],
		returns: { type: 'struct dirent', ref: true }, 
		throws: 'errno-on-null'
	},

	'readlink': {
		args: [
			{ type: 'char*', name: 'pathname' },
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'bufsiz' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'rmdir': {
		args: [
			{ type: 'char*', name: 'pathname' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'setenv': {
		args: [
			{ type: 'char*', name: 'name' },
			{ type: 'char*', name: 'value' },
			{ type: 'int', name: 'overwrite' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'setsid': {
		args: [],
		returns: { type: 'pid_t' },
		throws: 'errno'
	},

	'sleep': {
		args: [
			{ type: 'unsigned int', name: 'seconds' },
		],
		returns: { type: 'unsigned int' },
		throws: 'errno'
	},

	'unlink': {
		args: [
			{ type: 'char*', name: 'pathname'},
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'unsetenv': {
		args: [
			{ type: 'char*', name: 'name' },
		],
		returns: { type: 'int' },
		throws: 'errno'
	},

	'waitpid': {
		args: [
			{ type: 'pid_t', name: 'pid' },
			{ type: 'int', name: 'wstatus', ref: true, out: true },
			{ type: 'int', name: 'options' },
		],
		returns: { type: 'pid_t' },
		throws: 'errno'
	},

	'write': {
		args: [
			{ type: 'int', name: 'fd' },
			{ type: 'void*', name: 'buf' },
			{ type: 'size_t', name: 'count' },
		],
		returns: { type: 'ssize_t' },
		throws: 'errno'
	},
};
