const decoder = new TextDecoder();
const encoder = new TextEncoder();

const LF_CODE = '\n'.charCodeAt(0);

const io = {};

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

io.close = function(fd) {
	return j.close(fd);
}

io.dup = function(fd) {
	return j.dup(fd);
}

io.dup2 = function(fd, fd2) {
	return j.dup2(fd, fd2);
}

io.pipe = function() {
	return j.pipe();	
}

/**
 *
 * @param [{fd: number, events: number, revents: number}] fds
 * @param [number] nfds
 * @param [number] timeout in milliseconds or -1 to wait forever
 * @return [number] count of fds with events or 0 on timeout
 */
io.poll = function(fds, nfds, timeout) {
	return j.poll(fds, nfds, timeout);
}

io.read = function(fd, buf, count) {
	return j.read(fd, buf, count);
}

io.read_line = function(fd) {
	var buf = new Uint8Array(1);
	var bytes = [];

	while (true) {
		j.read(fd, buf, 1);

		if (buf[0] === LF_CODE) {
			break;
		}

		bytes.push(buf[0]);
	}

	return decoder.decode(new Uint8Array(bytes));
}

io.write = function(fd, buf, count) {
	return j.write(fd, buf, count);
}

io.write_line = function(fd, str) {
	io.write_str(fd, str + '\n');
}

io.write_str = function(fd, str) {
	const buf = encoder.encode(str);

	var i = j.write(fd, buf, buf.length);
	while (i < buf.length) {
		i += j.write(fd, new Uint8Array(buf.slice(i)), buf.length - i);
	}
}

return io;
