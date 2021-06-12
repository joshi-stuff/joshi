const fs = require('fs');
const proc = require('proc');
const term = require('term');

const print2 = term.print2;
const println2 = term.println2;

const test = {};

const TMP = fs.temp_directory + '/joshi';

var active_test = '?';
var active_things = [];
var failures;

test.expect = {
	array_equals: function (expected, actual) {
		if (expected.length !== actual.length) {
			test.fail('lengths differ:', actual.length, '!==', expected.length);
		}

		for (var i = 0; i < expected.length; i++) {
			if (expected[i] != actual[i]) {
				test.fail(
					'arrays differ at [' + i + ']:',
					actual[i],
					'!=',
					expected[i]
				);
			}
		}
	},

	equals: function (expected, actual) {
		if (expected != actual) {
			test.fail(actual, '!=', expected);
		}
	},

	includes: function (expected, actual) {
		if (!actual.includes(expected)) {
			test.fail(actual, 'does not include', expected);
		}
	},

	is: function (expected, actual) {
		if (expected !== actual) {
			test.fail(actual, '!==', expected);
		}
	},

	not_throws: function (cb) {
		cb();
	},

	throws: function (cb) {
		try {
			cb();
			test.fail('code did not throw error');
		} catch (err) {}
	},
};

test.fail = function () {
	const msg = '';

	for (var i = 0; i < arguments.length; i++) {
		if (i > 0) {
			msg += ' ';
		}
		msg += arguments[i];
	}

	throw new Error(msg);
};

test.finish = function () {
	if (!failures.length) {
		proc.exit(0);
	}

	println2('');
	println2('===============================================================');
	println2('= Summary of failed tests');
	println2('===============================================================');
	println2('');

	failures.forEach(function (failure) {
		const err = failure.err;
		const test = failure.test;
		const things = failure.things;

		if (things) {
			things.unshift(':');
			things.unshift(test);
			things.unshift('🔴');
			println2.apply(null, things);
		} else {
			println2('🔴', test + ':', err.toString().replace(/^Error: /, ''));
		}

		println2(err.stack.split('\n').slice(1).join('\n'));
		println2('');
	});

	proc.exit(1);
};

test.log = function () {
	const things = [active_test + ':'];

	for (var i = 0; i < arguments.length; i++) {
		things.push(arguments[i]);
	}

	active_things.push(things);
};

test.run = function (name, fn) {
	active_test = name;
	active_things.length = 0;
	try {
		print2(active_test + ': ');
		fn();
		println2('✅');
	} catch (err) {
		failures.push({
			err: err,
			test: active_test,
		});
		println2('🔴');
	}

	term.fg(128, 128, 128);
	active_things.forEach(function (things) {
		println2.apply(println2, things);
	});
	term.reset();

	active_test = '?';
};

test.start = function () {
	term.clear();

	zap(TMP);
	fs.mkdirp(TMP);

	failures = [];
};

test.tmp = function (path) {
	const tmp_path = fs.join(TMP, path);

	zap(tmp_path);

	return tmp_path;
};

function zap(path) {
	if (fs.exists(path)) {
		if (fs.is_directory(path)) {
			fs.rmdir(path, true);
		} else {
			fs.unlink(path);
		}
	}
}

return test;
