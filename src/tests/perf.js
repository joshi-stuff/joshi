const perf = require('perf');
const proc = require('proc');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('perf', function() {
	const p = perf.start('test');

	proc.sleep(1);
	p.lap('sleep');

	var a;
	for (var i = 0; i < 1000*1000; i++) {
		a = a + 1;
	}

	const r = p.end().report();

	log(r);

	expect.is(true, r.includes('test'));
	expect.is(true, r.includes('sleep'));

});



