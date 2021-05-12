const ARRAY = require('types/ARRAY.js');
const ATOMIC = require('types/ATOMIC.js');
const BUFFER = require('types/BUFFER.js');
const BUILTIN = require('types/BUILTIN.js');
const OPAQUE = require('types/OPAQUE.js');
const STRING = require('types/STRING.js');
const STRING_PT = require('types/STRING_PT.js');
const STRUCT = require('types/STRUCT.js');

return {
	// Atomic types
	blkcnt_t: ATOMIC('int'),
	blksize_t: ATOMIC('int'),
	'char[]': STRING(),
	'char*': STRING_PT(),
	'const char*': STRING_PT(),
	dev_t: ATOMIC('int'),
	gid_t: ATOMIC('int'),
	mode_t: ATOMIC('int'),
	nfds_t: ATOMIC('int'),
	nlink_t: ATOMIC('int'),
	ino_t: ATOMIC('int'),
	int: BUILTIN('int'),
	long: ATOMIC('number'),
	off_t: ATOMIC('number'),
	pid_t: ATOMIC('int'),
	size_t: ATOMIC('int'),
	ssize_t: ATOMIC('int'),
	'short int': ATOMIC('int'),
	uid_t: ATOMIC('int'),
	unsigned: ATOMIC('int'),
	'unsigned char': ATOMIC('int'),
	'unsigned int': ATOMIC('int'),

	// Opaque types
	'DIR*': OPAQUE(),

	// Buffer types
	'void*': BUFFER(),

	// Array types
	'char*[]': ARRAY('char*'),
	'int[]': ARRAY('int'),
	'struct pollfd[]': ARRAY('struct pollfd'),

	// Struct types
	'struct dirent': STRUCT([
		{ type: 'ino_t', name: 'd_ino' },
		{ type: 'off_t', name: 'd_off' },
		{ type: 'unsigned int', name: 'd_reclen' },
		{ type: 'unsigned char', name: 'd_type' },
		{ type: 'char[]', name: 'd_name', length: 256 },
	]),
	'struct stat': STRUCT([
		{ type: 'dev_t', name: 'st_dev' },
		{ type: 'ino_t', name: 'st_ino' },
		{ type: 'mode_t', name: 'st_mode' },
		{ type: 'nlink_t', name: 'st_nlink' },
		{ type: 'uid_t', name: 'st_uid' },
		{ type: 'gid_t', name: 'st_gid' },
		{ type: 'dev_t', name: 'st_rdev' },
		{ type: 'off_t', name: 'st_size' },
		{ type: 'blksize_t', name: 'st_blksize' },
		{ type: 'blkcnt_t', name: 'st_blocks' },
		{ type: 'struct timespec', name: 'st_atim' },
		{ type: 'struct timespec', name: 'st_mtim' },
		{ type: 'struct timespec', name: 'st_ctim' },
	]),
	'struct pollfd': STRUCT([
		{ type: 'int', name: 'fd' },
		{ type: 'short int', name: 'events' },
		{ type: 'short int', name: 'revents' },
	]),
	'struct timespec': STRUCT([
		{ type: 'long', name: 'tv_nsec' },
		{ type: 'long', name: 'tv_sec' },
	]),
};
