const decoder = new TextDecoder();
const encoder = new TextEncoder();

const io = {};

// Poll flags
io.POLLIN = 0x1;
io.POLLPRI = 0x2;
io.POLLOUT = 0x4;
io.POLLERR = 0x8;
io.POLLHUP = 0x10;
io.POLLNVAL = 0x20;
io.POLLRDNORM = 0x40;
io.POLLRDBAND = 0x80;
io.POLLWRNORM = 0x100;
io.POLLWRBAND = 0x200;
io.POLLMSG = 0x400;
io.POLLREMOVE = 0x1000;
io.POLLRDHUP = 0x2000;

// lseek flags
io.SEEK_SET = 0;
io.SEEK_CUR = 1;
io.SEEK_END = 2;

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
 * @param [number?] mode access mode (default: 0644)
 */
io.append = function(pathname, mode) {
	mode = mode || 0644;

	return j.open(pathname, O_CREAT|O_APPEND|O_RDWR, Number(mode));
}

io.close = function(fd) {
	return j.close(Number(fd));
}

/**
 * Open a file. If the file does not exist it is created. If it exists its
 * contents remain untouched.
 *
 * @param [number?] mode optional access mode (default: 0644)
 */
io.create = function(pathname, mode) {
	mode = mode || 0644;

	return j.open(pathname, O_CREAT|O_RDWR, Number(mode));
}

io.dup = function(fd) {
	return j.dup(Number(fd));
}

io.dup2 = function(targetFd, changedFd) {
	return j.dup2(Number(targetFd), Number(changedFd));
}

io.lseek = function(fd, offset, whence) {
	return j.lseek(fd, offset, whence);
}

io.open = function(pathname) {
	try {
		return j.open(pathname, 0, 0);
	}
	catch(err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
}

io.pipe = function() {
	const fildes = [-1, -1];

	return j.pipe(fildes).fildes;	
}

/**
 *
 * @param [{fd: number, events: number, revents: number}] fds
 * @param [number] timeout in milliseconds or -1 to wait forever
 * @return [number] count of fds with events or 0 on timeout
 */
io.poll = function(fds, timeout) {
	const result = j.poll(fds, fds.length, Number(timeout));

	fds.length = 0;
	for (var i=0; i<result.fds.length; i++) {
		fds.push(result.fds[i]);
	}

	return result.value;
}

io.read = function(fd, buf, count) {
	count = count || buf.length;

	return j.read(Number(fd), buf, Number(count));
}

/**
 * Read contents of a fd until it is exhausted and return them as a Uint8Array.
 *
 * @param [number] fd
 * @return [Uint8Array] 
 */
io.read_bytes = function(fd) {
	const buf = new Uint8Array(1024);
	const bytes = [];
	
	var count;
	while ((count = io.read(fd, buf, buf.length)) !== 0) {
		for (var i = 0; i < count; i++) {
			bytes.push(buf[i]);
		}
	}

	return new Uint8Array(bytes);
}

/**
 * Read contents of a fd until it is exhausted and return them as a String.
 *
 * @param [number] fd
 * @return [String] 
 */
io.read_file = function(fd) {
	return decoder.decode(io.read_bytes(fd));
}

io.safe_close = function(fd) {
	try {
		io.close(fd);
	} 
	catch(err) {
		// ignore
	}
}

io.tell = function(fd) {
	return io.lseek(fd, 0, io.SEEK_CUR);
}

/**
 * Open a file and empty it. If the file does not exist it is created.
 *
 * @param [number?] mode optional access mode (default: 0644)
 */
io.truncate = function(pathname, mode) {
	mode = mode || 0644;

	return j.open(pathname, O_CREAT|O_TRUNC|O_RDWR, Number(mode));
}

io.write = function(fd, buf, count) {
	count = count || buf.length;

	return j.write(Number(fd), buf, Number(count));
}

io.write_line = function(fd, str) {
	io.write_str(Number(fd), str + '\n');
}

io.write_str = function(fd, str) {
	fd = Number(fd);

	const buf = encoder.encode(str.toString());

	var i = j.write(fd, buf, buf.length);

	while (i < buf.length) {
		i += j.write(fd, new Uint8Array(buf.slice(i)), buf.length - i);
	}
}

return io;
