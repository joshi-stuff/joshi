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
crypto.crypt = function(text, salt) {
	return j.crypt(text, salt);
}

/**
 * Get true random bytes (returned by the operating system RNG)
 *
 * @param {number} count Number of bytes to return
 * @returns {Uint8Array} A buffer with `count` true random bytes
 * @throws {SysError}
 */
crypto.get_random_bytes = function(count) {
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
}

return crypto;
