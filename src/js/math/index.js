const println2 = require('term').println2;

const math = {};

math.get_random_bytes = function(count) {
	const buf = new Uint8Array(count);

	const bread = j.getrandom(buf, count, 0);

	// TODO: resize buf to returned length
	return buf;
}

return math;
