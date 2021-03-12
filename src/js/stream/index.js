const io = require('io');

const decoder = new TextDecoder();

const stream = {};

function feed(sd) {
	const bread = io.read(sd._fd, sd._buffer, sd._buffer.length);

	if (bread === 0) {
		return false;
	}

	for (var i = 0; i < bread; i++) {
		sd._pushback.push(sd._buffer[i]);
	}

	return true;
}


/**
 * Returns an opaque stream object
 */
stream.create = function(fd) {
	return {
		_buffer: new Uint8Array(256),
		_fd: fd,
		_pushback: []
	};
}

stream.read_line = function(sd) {
	return stream.read_until(sd, '\n');
}

/**
 * @return 
 * A string without the delimiter or null if EOF was found before delimiter.
 */
stream.read_until = function(sd, delim) {
	// TODO: support string delimiters
	if (delim.length !== 1) {
		throw new Error('Only 1-char delimiters are supported');
	}

	delim = delim.charCodeAt(0);

	const bytes = [];

	while (true) {
		while (sd._pushback.length) {
			const b = sd._pushback.shift();

			if (b === delim) {
				return decoder.decode(new Uint8Array(bytes));
			}

			bytes.push(b);
		}

		if (!feed(sd)) {
			return null;
		}
	}
}

return stream;
