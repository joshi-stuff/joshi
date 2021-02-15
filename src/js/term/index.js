const io = require('io');

const term = {};

term.print = function() {
	const str = '';

	for (var i=0; i<arguments.length; i++) {
		var thing = arguments[i];

		if (i > 0) {
			str += ' ';
		}

		if (thing === null) {
			str += '(null)';
		} else if (thing === undefined) {
			str += '(undefined)';
		} else {
			str += thing.toString();
		}
	}

	io.write_str(1, str);
}

term.println = function() {
	const things = [];
	for (var i=0; i<arguments.length; i++) {
		things.push(arguments[i]);
	}
	things.push('\n');

	term.print.apply(null, things);
}

return term;
