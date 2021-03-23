const io = require('io');
const fs = require('fs');
const proc = require('proc');
const $ = require('shell');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('$().dir', function() {
	const x = {};

	$('pwd')
		.dir('/dev')
		.pipe(1, x)
		.do();

	expect.is('/dev\n', x.out);
});

test('$().env', function() {
	const x = {};

	$('env')
		.env({MY_VAR: 'my_value'})
		.pipe(1, x)
		.do();

	expect.includes('MY_VAR=my_value\n', x.out);
});


/*****/

test('more < FILE', function() {
	const FILE = '/etc/environment';
	const x = {};

	$('more')
		.pipe(0, FILE)
		.pipe(1, x)
		.do();

	expect.is(fs.read_file(FILE), x.out);
});

test('echo perico > FILE', function() {
	const FILE = '/tmp/test_truncate';

	$('echo', 'perico')
		.pipe(1, '0:' + FILE)
		.do();

	expect.is('perico\n', fs.read_file(FILE));
});

test('echo perico >> FILE', function() {
	const FILE = '/tmp/test_append';

	$('echo', 'perico')
		.pipe(1, FILE)
		.do();

	$('echo', 'perico')
		.pipe(1, '+:' + FILE)
		.do();

	expect.is('perico\nperico\n', fs.read_file(FILE));
});

test('echo perico > null', function() {
	const FILE = '/tmp/test_append';

	fs.unlink(FILE, false);

	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 1);

		io.write_string(1, 'holi');

		$('echo', 'perico')
			.pipe(1, null)
			.do();
	});

	io.seek(fd, 0);
	const str = io.read_string(fd);

	log('the string "perico" should NOT appear above this line');

	expect.is('holi', str);
});

test('more < HERE_STRING', function() {
	const x = {};

	$('more')
		.pipe(0, ['perico'])
		.pipe(1, x)
		.do();

	expect.is('perico', x.out);
});

