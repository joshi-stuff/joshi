const errno = require('errno');

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/**
 * A poll() descriptor
 *
 * @typedef {object} Pollfd
 *
 * @property {number} fd File descriptor to check
 *
 * @property {number} events 
 * Events to check (the "See" section list possible values)
 *
 * @property {number} revents 
 * Returned events (the "See" section list possible values)
 *
 * @see {@link module:io.POLLIN}
 * @see {@link module:io.POLLPRI}
 * @see {@link module:io.POLLOUT}
 * @see {@link module:io.POLLERR}
 * @see {@link module:io.POLLHUP}
 * @see {@link module:io.POLLNVAL}
 * @see {@link module:io.POLLRDNORM}
 * @see {@link module:io.POLLRDBAND}
 * @see {@link module:io.POLLWRNORM}
 * @see {@link module:io.POLLWRBAND}
 * @see {@link module:io.POLLMSG}
 * @see {@link module:io.POLLREMOVE}
 * @see {@link module:io.POLLRDHUP}
 */

const LF_CODE = '\n'.charCodeAt(0);


/** 
 * @exports io 
 * @readonly
 * @enum {number}
 */
const io = {
	/* Poll flags */
	POLLIN: 0x1,
	POLLPRI: 0x2,
	POLLOUT: 0x4,
	POLLERR: 0x8,
	POLLHUP: 0x10,
	POLLNVAL: 0x20,
	POLLRDNORM: 0x40,
	POLLRDBAND: 0x80,
	POLLWRNORM: 0x100,
	POLLWRBAND: 0x200,
	POLLMSG: 0x400,
	POLLREMOVE: 0x1000,
	POLLRDHUP: 0x2000,

	/* seek flags */

	/** Seek from start of file */
	SEEK_SET: 0,
	/** Seek from current position */
	SEEK_CUR: 1,
	/** Seek from end of file */
	SEEK_END: 2,
};

const O_APPEND = 02000;
const O_CREAT = 0100;
const O_RDWR = 02;
const O_TRUNC = 01000;

/**
 * Open a file for appending. If the file does not exist it is created. If it 
 * exists its contents remain untouched.
 *
 * Note that the file pointer will always be set to EOF before any write
 * operation.
 *
 * @param {string} pathname Path to file
 *
 * @param {number} [mode=0644]
 * Access mode of file in case it needs to be created
 *
 * @returns {number} The file descriptor
 * @throws {SysError}
 * @see {module:io.create}
 * @see {module:io.open}
 * @see {module:io.truncate}
 */
io.append = function(pathname, mode) {
	mode = Number(mode || 0644);

	return j.open(pathname, O_CREAT|O_APPEND|O_RDWR, mode);
}

/**
 * Close an open file
 *
 * @param {number} fd The file descriptor
 * @param {boolean} [fail_if_closed=true] Fail if file is already closed
 * @returns {0}
 * @throws {SysError}
 */
io.close = function(fd, fail_if_closed) {
	try {
		return j.close(Number(fd));
	} 
	catch(err) {
		if (fail_if_closed || (err.errno !== errno.EBADF)) {
			throw err;
		}

		return 0;
	}
}

/**
 * Open a file. If the file does not exist it is created. If it exists its
 * contents remain untouched.
 *
 * @param {string} pathname Path to file
 *
 * @param {number} [mode=0644]
 * Access mode of file in case it needs to be created
 *
 * @returns {number} The file descriptor
 * @throws {SysError}
 * @see {module:io.append}
 * @see {module:io.open}
 * @see {module:io.truncate}
 */
io.create = function(pathname, mode) {
	mode = Number(mode || 0644);

	return j.open(pathname, O_CREAT|O_RDWR, mode);
}

/**
 * Duplicate an open file descriptor
 *
 * @param {number} fd The existing file descriptor
 * @returns {number} The new file descriptor
 * @throws {SysError}
 */
io.dup = function(fd) {
	return j.dup(Number(fd));
}

/**
 * Duplicate an open file descriptor assigning it to another custom fd
 *
 * @param {number} openFd The existing file descriptor
 * @param {number} changedFd The file descriptor that will be changed
 * @returns {number} The changed file descriptor
 * @throws {SysError}
 */
io.dup2 = function(openFd, changedFd) {
	return j.dup2(Number(openFd), Number(changedFd));
}

/**
 * Open an existing file.
 *
 * @param {string} pathname Path to file
 *
 * @returns {number} The file descriptor
 * @throws {SysError}
 * @see {module:io.append}
 * @see {module:io.create}
 * @see {module:io.truncate}
 */
io.open = function(pathname) {
	try {
		return j.open(pathname, 0, 0);
	}
	catch(err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
}

/**
 * Create a pipe
 *
 * @returns {number[]} 
 * An array with two file descriptors where `[0]` item is the read end of the
 * pipe and `[1]` is the write end.
 *
 * @throws {SysError}
 */
io.pipe = function() {
	const fildes = [-1, -1];

	return j.pipe(fildes).fildes;	
}

/**
 * The poll() function provides applications with a mechanism for multiplexing 
 * input/output over a set of file descriptors.
 *
 * For each member of the array pointed to by `fds`, poll() shall examine the 
 * given file descriptor for the event(s) specified in events.
 *
 * The poll() function shall identify those file descriptors on which an 
 * application can read or write data, or on which certain events have occurred.
 *
 * @param {Pollfd} fds File descriptors and events to check
 * @param {number} [timeout=-1] Timeout in milliseconds or -1 to wait forever
 * @returns {number} Count of fds with events or 0 on timeout
 * @throws {SysError}
 */
io.poll = function(fds, timeout) {
	if (timeout === undefined) {
		timeout = -1;
	}

	timeout = Number(timeout);

	const result = j.poll(fds, fds.length, timeout);

	fds.length = 0;
	for (var i=0; i<result.fds.length; i++) {
		fds.push(result.fds[i]);
	}

	return result.value;
}

/**
 * Read bytes from an open file
 *
 * @param {number} fd An open file desriptor
 * @param {Uint8Array} buf Buffer to fill with read bytes
 *
 * @param {number} [count=-1] 
 * Maximum number of bytes to read, or `-1` to read until buffer is full or EOF.
 *
 * Note that it is not the same `-1` as `buf.length`, because `buf.length` does
 * not guarantee that the whole buffer is read.
 *
 * @returns {number} 
 * The number of bytes read (with 0 meaning end of file).
 *
 * In the case where `count = -1`, a return less than buffer length means that
 * EOF was reached.
 *
 * @throws {SysError}
 */
io.read = function(fd, buf, count) {
	if (count === undefined) {
		count = -1;
	}

	fd = Number(fd);
	count = Number(count);

	if (count === -1) {
		count = buf.length;

		const bleft = buf.length;

		while (true) {
			const bread = j.read(fd, buf, bleft);

			if (bread === 0) {
				break;
			}

			bleft -= bread;

			if (bleft === 0) {
				break;
			}

			buf = new Uint8Array(buf, bread);
		}

		return count - bleft;
	} 
	else {
		return j.read(fd, buf, count);
	}
}

/**
 * Read contents of a fd until it is exhausted and return them as an Uint8Array.
 *
 * @param {number} fd An open file desriptor
 * @returns {Uint8Array} The bytes contained by the file
 * @throws {SysError}
 */
io.read_fully = function(fd) {
	const buf = new Uint8Array(4096);

	var bytes = new Uint8Array(buf.length);
	var count = 0;

	while (true) {
		const bread = io.read(fd, buf);

		if (bytes.length < (count + bread)) {
			const new_bytes =
				(count > 0x100000) 
					? new Uint8Array(count + 0x100000)
					: new Uint8Array(count * 2);

			new_bytes.set(bytes);

			bytes = new_bytes;
		}

		bytes.set(buf, count);

		count += bread;

		if (bread < buf.length) {
			break;
		}
	}

	if (bytes.length !== count) {
		const new_bytes = new Uint8Array(count);

		new_bytes.set(bytes.subarray(0, count));

		bytes = new_bytes;
	}

	return bytes;
}

/**
 * Read contents of a fd until it is exhausted and return them as a string. 
 *
 * The bytes are interpreted as UTF-8.
 *
 * @param {number} fd An open file desriptor
 * @returns {string} The contents of the file interpreted as an UTF-8 string
 * @throws {SysError}
 */
io.read_string = function(fd) {
	return decoder.decode(io.read_fully(fd));
}

/**
 * Set the pointer of a file descriptor to a given value
 *
 * @param {number} fd An open file descriptor
 * @param {number} offset Relative offset for file pointer
 *
 * @param {number} whence
 * Base of offset. One of the values: {@link module:io.SEEK_SET}, 
 * {@link module:io.SEEK_CUR}, or {@link module:io.SEEK_END}.
 *
 * @returns {number} The resulting offset measured from start of file
 * @throws {SysError}
 */
io.seek = function(fd, offset, whence) {
	return j.lseek(fd, offset, whence);
}

/**
 * Retrieve the current offset of the file pointer from the start of the file.
 *
 * @param {number} fd An open file desriptor
 * @returns {number} The offset of the file pointer
 * @throws {SysError}
 */
io.tell = function(fd) {
	return io.seek(fd, 0, io.SEEK_CUR);
}

/**
 * Open a file and empty it. If the file does not exist it is created.
 *
 * @param {string} pathname Path to file
 *
 * @param {number} [mode=0644]
 * Access mode of file in case it needs to be created
 *
 * @returns {number} The file descriptor
 * @throws {SysError}
 * @see {module:io.append}
 * @see {module:io.create}
 * @see {module:io.open}
 */
io.truncate = function(pathname, mode) {
	mode = mode || 0644;

	return j.open(pathname, O_CREAT|O_TRUNC|O_RDWR, Number(mode));
}

/**
 * Write bytes to an open file
 *
 * @param {number} fd An open file desriptor
 * @param {Uint8Array} buf Buffer containing bytes to write
 *
 * @param {number} [count=-1] 
 * Maximum number of bytes to write or -1 to keep writing until all buffer has 
 * been written. 
 *
 * Note that it is not the same `-1` as `buf.length`, because `buf.length` does
 * not guarantee that the whole buffer is written.
 *
 * @returns {number} The number of bytes written
 * @throws {SysError}
 */
io.write = function(fd, buf, count) {
	if (count === undefined) {
		count = -1;
	}

	fd = Number(fd)
	count = Number(count);

	if (count === -1) {
		count = buf.length;

		var bleft = buf.length;

		while (true) {
			const bwritten = j.write(fd, buf, bleft);

			bleft -= bwritten;

			if (bleft === 0) {
				break;
			}

			buf = new Uint8Array(buf, bwritten);
		}

		return count;
	} 
	else {
		return j.write(fd, buf, count);
	}
}

/**
 * Write a string as UTF-8 bytes to an open file
 *
 * @param {number} fd An open file desriptor
 * @param {string} str The string to write
 * @returns {number} The number of bytes written
 * @throws {SysError}
 */
io.write_string = function(fd, str) {
	fd = Number(fd);
	str = str.toString();

	return io.write(fd, encoder.encode(str.toString()));
}

return io;
