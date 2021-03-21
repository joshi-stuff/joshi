const errno = require('errno');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('fail', function() {
	try {
		errno.fail(errno.EBADF);
		fail('Did not throw');
	}
	catch(err) {
		log('err =', err);
		expect.is(errno.EBADF, err.errno);
		expect.is('Bad file number (errno = 9)', err.message);
	}
});

