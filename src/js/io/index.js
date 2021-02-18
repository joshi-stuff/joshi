const decoder = new TextDecoder();
const encoder = new TextEncoder();

const LF_CODE = '\n'.charCodeAt(0);

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

	return j.open(pathname, O_CREAT|O_APPEND|O_RDRW, Number(mode));
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

io.open = function(pathname) {
	return j.open(pathname, 0);
}

io.pipe = function() {
	return j.pipe();	
}

/**
 *
 * @param [{fd: number, events: number, revents: number}] fds
 * @param [number] timeout in milliseconds or -1 to wait forever
 * @return [number] count of fds with events or 0 on timeout
 */
io.poll = function(fds, timeout) {
	return j.poll(Number(fds), fds.length, Number(timeout));
}

io.read = function(fd, buf, count) {
	count = count || buf.length;

	return j.read(Number(fd), buf, Number(count));
}

io.read_line = function(fd) {
	var buf = new Uint8Array(1);
	var bytes = [];

	while (true) {
		if (j.read(fd, buf, 1) === 0) {
			break;
		}

		if (buf[0] === LF_CODE) {
			break;
		}

		bytes.push(buf[0]);
	}

	return decoder.decode(new Uint8Array(bytes));
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

	var i = j.write(fd, buf);
	while (i < buf.length) {
		i += j.write(fd, new Uint8Array(buf.slice(i)), buf.length - i);
	}
}

return io;
