return {
	close: function(fd) {
		return j.close(fd);
	},

	dup: function(fd) {
		return j.dup(fd);
	},

	dup2: function(fd, fd2) {
		return j.dup2(fd, fd2);
	},

	pipe: function() {
		return j.pipe();	
	},

	read: function(fd, count) {
		return j.read(fd, count);
	},

	read_str: function(fd, count) {
		// TODO: check bytes read
		const buf = j.read(fd, count).buf;

		const str = "";
		for (var i=0; i<buf.length; i++) {
			str += String.fromCharCode(buf[i]);
		}
		return str;
	},

	write: function(fd, buf, count) {
		return j.write(fd, buf, count);
	},

	write_str: function(fd, str) {
		const buf = new Uint8Array(str.length);

		// TODO: convert from UTF-16 to UTF-8 encoding correctly
		for (var i=0; i<str.length; i++) {
			buf[i] = str.charCodeAt(i) & 0xFF;
		}

		// TODO: check bytes written
		return j.write(fd, buf, buf.length);
	},
};
