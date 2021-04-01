const fs = require('fs');
const io = require('io');
const kern = require('kern');
const proc = require('proc');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('printk', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 2);
		kern.printk('holi');
	});

	io.close(fd);

	expect.is('holi', fs.read_file(FILE));
});

test('search_path', function() {
	try {
		const mydir = fs.dirname(require.owner_path);

		kern.search_path = [mydir];

		const path = require.resolve('./test.js');

		expect.is(mydir + '/test.js', path);
	} finally {
		kern.search_path = [];
	}
});

test('version', function() {
	const v = kern.version.split('.');

	expect.is(false, isNaN(Number(v[0])));
	expect.is(false, isNaN(Number(v[1])));

	v[2] = v[2].replace('-next', '');
	expect.is(false, isNaN(Number(v[2])));

	log(kern.version);
});
