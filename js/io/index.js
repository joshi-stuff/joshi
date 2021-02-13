const decoder = new TextDecoder();
const encoder = new TextEncoder();

const LF_CODE = '\n'.charCodeAt(0);

const io = {};

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
