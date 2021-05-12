const io = require('io');

const decoder = new TextDecoder();

/**
 * @exports stream
 */
const stream = {};

/**
 * Create an stream from a file descriptor.
 *
 * Streams are an efficient way to scan file descriptors for certain types of
 * formats (f.e.: a line of text), without needing to read one byte at a time.
 *
 * Note that you should NOT create more than one stream for the same file
 * descriptor or you may get into trouble because reads may look incoherent.
 *
 * @param {number} fd A valid file descriptor
 * @returns {object} An opaque stream descriptor
 */
stream.create = function (fd) {
	return {
		_buffer: new Uint8Array(256),
		_fd: fd,
		_pushback: [],
	};
};

/**
 * Read a whole line (all available characters until '\n' or EOF).
 *
 * @param {object} sd An opaque stream descriptor
 *
 * @returns {null|string}
 * A line of text (without the ending `\n`) or null if EOF was found before
 * the delimiter.
 */
stream.read_line = function (sd) {
	return stream.read_until(sd, '\n');
};

/**
 * Read available characters until a delimiter is found.
 *
 * Note that, for now, only character (as opposed to string) delimiters are
 * supported.
 *
 * @param {object} sd An opaque stream descriptor
 * @param {string} delim A one-char string containing the delimiter
 *
 * @returns {string}
 * A string without the delimiter or null if EOF was found before the delimiter.
 */
stream.read_until = function (sd, delim) {
	// TODO: support string delimiters
	if (delim.length !== 1) {
		throw new Error('Only one-char delimiters are supported');
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
};

/**
 * Feed a stream's buffer with more bytes
 *
 * @param {object} sd An opaque stream descriptor
 * @returns {boolean} The value `true` if anything was read, `false` on EOF
 * @private
 */
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

return stream;
