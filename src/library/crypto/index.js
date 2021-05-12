const encoder = new TextEncoder();

/**
 * @exports crypto
 */
const crypto = {};

/**
 * Securely hash a password using system's crypt function
 *
 * @param {string} text The password to hash
 * @param {string} salt The salt and hashing options
 * @return {string} The hashed password
 * @throws {SysError}
 */
crypto.crypt = function (text, salt) {
	return j.crypt(text, salt);
};

/**
 * Get true random bytes (returned by the operating system RNG)
 *
 * @param {number} count Number of bytes to return
 * @returns {Uint8Array} A buffer with `count` true random bytes
 * @throws {SysError}
 */
crypto.get_random_bytes = function (count) {
	const buf = new Uint8Array(count);

	var bread = j.getrandom(buf, count, 0);

	if (bread === count) {
		return buf;
	}

	const bytes = new Uint8Array(count);

	bytes.set(0, buf);

	var left = count - bread;

	while (left > 0) {
		bread = j.getrandom(buf, left, 0);

		bytes.set(count - left, buf.subarray(0, bread));

		left -= bread;
	}

	return bytes;
};

/**
 * Compute SHA-256 hash for given data
 *
 *
 * @param {string|Uint8Array} data
 * Data to digest. If a string is given, it is first encoded as UTF-8 bytes.
 *
 * @returns {string|Uint8Array}
 * Returns the hash of the given data. If a string is given as data, the return
 * value is an hexadecimal representation of the hash.
 */
crypto.sha256 = function (data) {
	var data_is_string = typeof data === 'string';

	if (data_is_string) {
		data = encoder.encode(data);
	}

	const hash = sha256(data);

	if (data_is_string) {
		var str = '';

		for (var i = 0; i < hash.length; i++) {
			const hex = Number(hash[i]).toString(16);

			if (hex.length < 2) {
				str += '0';
			}

			str += hex;
		}

		hash = str.toUpperCase();
	}

	return hash;
};

/**
 * SHA-256 implementation taken from https://github.com/geraintluff/sha256 with
 * slight modifications to support Uint8Array
 *
 * @param {Uint8Array} data
 * @return {Uint8Array}
 * @private
 */
function sha256(data) {
	const maxWord = Math.pow(2, 32);
	var i, j, k; // Used as a counter across the whole file

	// Initial hash value: first 32 bits of the fractional parts of the square
	// roots of the first 8 primes (we actually calculate the first 64, but
	// extra values are just ignored)
	var hash = (sha256.h = sha256.h || []);
	// Round constants: first 32 bits of the fractional parts of the cube roots
	// of the first 64 primes
	var k = (sha256.k = sha256.k || []);
	var primeCounter = k.length;

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
			k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	// Append '1' bit (plus zero padding), then zero pad until data bit count is
	// a multiple of 512, less 64 bits
	var padding_length = 56 - (data.length % 64);

	if (padding_length < 0) {
		padding_length += 64;
	}

	const padded_data = new Uint8Array(data.length + padding_length);
	padded_data.set(data);
	padded_data[data.length] = 0x80;

	j = data.length + 1;
	for (i = 0; i < padding_length; i++) {
		padded_data[j++] = 0;
	}

	// Copy padded data to words buffer and append data bit length
	const dataBitLength = data.length * 8;
	const words = [];
	// TODO: make words an Uint32Array

	for (i = 0; i < padded_data.length; i++) {
		j = padded_data[i];
		words[i >> 2] |= j << (((3 - i) % 4) * 8);
	}
	words[words.length] = (dataBitLength / maxWord) | 0;
	words[words.length] = dataBitLength;

	// process each chunk
	for (j = 0; j < words.length; ) {
		// The message is expanded into 64 words as part of the iteration
		var w = words.slice(j, (j += 16));
		var oldHash = hash;
		// This is now the "working hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			// Expand the message into 64 words
			// Used below if
			var w15 = w[i - 15],
				w2 = w[i - 2];

			// Iterate
			var a = hash[0],
				e = hash[4];
			var temp1 =
				hash[7] +
				(rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
				((e & hash[5]) ^ (~e & hash[6])) + // ch
				k[i] +
				// Expand the message schedule if needed
				(w[i] =
					i < 16
						? w[i]
						: (w[i - 16] +
								(rightRotate(w15, 7) ^
									rightRotate(w15, 18) ^
									(w15 >>> 3)) + // s0
								w[i - 7] +
								(rightRotate(w2, 17) ^
									rightRotate(w2, 19) ^
									(w2 >>> 10))) | // s1
						  0);
			// This is only used once, so *could* be moved below, but it only
			// saves 4 bytes and makes things unreadble
			var temp2 =
				(rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
				((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

			// We don't bother trimming off the extra ones, they're harmless as
			// long as we're truncating when we do the slice()
			hash = [(temp1 + temp2) | 0].concat(hash);
			hash[4] = (hash[4] + temp1) | 0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}

	// Copy result to an Uint8Array
	// TODO: check if we can "cast" the Uint32Array to Uint8Array
	const result = new Uint8Array(32);

	k = 0;
	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			result[k++] = (hash[i] >> (j * 8)) & 255;
		}
	}

	return result;
}

function rightRotate(value, amount) {
	return (value >>> amount) | (value << (32 - amount));
}

return crypto;
