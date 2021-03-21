const fs = require('fs');
const io = require('io');
const kern = require('kern');
const math = require('math');
const proc = require('proc');
const $ = require('shell');
const stream = require('stream');
const term = require('term');
const print = require('term').print;
const print2 = require('term').print2;
const println = require('term').println;
const println2 = require('term').println2;

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

term.clear();

require('./errno.js');
require('./kern.js');
require('./math.js');
require('./perf.js');
require('./io.js');
require('./stream.js');
require('./fs.js');
require('./proc.js');

// Test shell
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
	$('echo', 'perico')
		.pipe(1, null)
		.do();
	
	log('the string "perico" should NOT appear above this line');
});

test('more < HERE_STRING', function() {
	const x = {};

	$('more')
		.pipe(0, ['perico'])
		.pipe(1, x)
		.do();

	expect.is('perico', x.out);
});
