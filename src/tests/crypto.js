const crypto = require('crypto');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('crypt', function() {
	const hash = crypto.crypt('perico', '$6$salt');

	expect.is('$6$salt$c7ZtpYuhL5B4Bb5TQaqO45OxvKKQpxfTiC0rhUgB98ho5Pr1RbPrs4HRTpfuVdEzBIsz7KvdnaxG9t/UpTHm61', hash);
});

test('get_random_bytes', function() {
	const bytes = crypto.get_random_bytes(4);

	expect.is(4, bytes.length);

	var str = '';
	for (var i=0; i<bytes.length; i++) {
		str += bytes[i].toString(16);
	}
	log(str);
});
