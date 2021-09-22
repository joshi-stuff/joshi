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

	const hash = j.sha256(data, data.length);

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

return crypto;
