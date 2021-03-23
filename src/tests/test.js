const proc = require('proc');
const term = require('term');

const print2 = term.print2;
const println2 = term.println2;

const test = {};

var active_test = '?';
var active_things = [];

test.expect = {
	array_equals: function(expected, actual) {
		if (expected.length !== actual.length) {
			test.fail('lengths differ:', actual.length, '!==', expected.length);
		}

		for (var i=0; i < expected.length; i++) {
			if (expected[i] != actual[i]) {
				test.fail(
					'arrays differ at ['+i+']:', actual[i], '!=', expected[i]
				);
			}
		}
	},

	equals: function(expected, actual) {
		if (expected != actual) {
			test.fail(actual, '!=', expected);
		}
	},

	includes: function(expected, actual) {
		if (!actual.includes(expected)) {
			test.fail(actual, 'does not include', expected);
		}
	},

	is: function(expected, actual) {
		if (expected !== actual) {
			test.fail(actual, '!==', expected);
		}
	},

	not_throws: function(cb) {
		cb();
	},

	throws: function(cb) {
		try {
			cb();
			test.fail('code did not throw error');
		}
		catch(err) {
		}
	},
}

test.fail = function() {
	const things = ['🔴', 'failed:'];

	for (var i=0; i<arguments.length; i++) {
		things.push(arguments[i]);
	}

	println2.apply(println2, things);
	println2(new Error().stack.split('\n').slice(1).join('\n'));
	proc.exit(1);
}

test.log = function() {
	const things = [active_test+':'];

	for (var i=0; i<arguments.length; i++) {
		things.push(arguments[i]);
	}

	active_things.push(things);
}

test.run = function(name, fn) {
	active_test = name;
	active_things.length = 0;
	try {
		print2(active_test+': ');
		fn();
		println2('✅');
	} catch(err) {
		println2('🔴', 'failed:', err.toString());
		println2(err.stack.split('\n').slice(1).join('\n'));
		proc.exit(1);
	}

	term.fg(128, 128, 128);
	active_things.forEach(function(things) {
		println2.apply(println2, things);
	});
	term.reset();

	active_test = '?';
}

return test;
