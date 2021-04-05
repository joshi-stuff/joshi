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

test('sha256 > with perfect size buffer', function() {
	const hash = crypto.sha256(
		'1234567890123456789012345678901234567890123456789012345'
	);

	expect.is(
		'03C3A70E99ED5EECCD80F73771FCF1ECE643D939D9ECC76F25544B0233F708E9',
		hash	
	);
});

test('sha256 > with single padding needed', function() {
	const hash = crypto.sha256(
		'12345678901234567890123456789012345678901234567890'
	);

	expect.is(
		'F58FFFBA129AA67EC63BF12571A42977C0B785D3B2A93CC0538557C91DA2115D',
		hash	
	);
});

test('sha256 > with double padding needed', function() {
	const hash = crypto.sha256(
		'En un lugar de la Mancha de cuyo nombre no quiero acordarme...'
	);

	expect.is(
		'18BD46DB70C25F5AF60AEAF927754B9D212CADFAA650895631775DE3BBB44114',
		hash	
	);
});

