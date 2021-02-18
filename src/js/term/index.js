const io = require('io');

const term = {};

// See https://en.wikipedia.org/wiki/ANSI_escape_code
const CSI = String.fromCharCode(0x1B) + '['; 

term.bg = function(r, g, b) {
	term.print(CSI + '48;2;' + r + ';' + g + ';' + b + 'm');
}

term.fg = function(r, g, b) {
	term.print(CSI + '38;2;' + r + ';' + g + ';' + b + 'm');
}

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
		} else if (thing.toString() === '[object Object]') {
			str += JSON.stringify(thing);
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

term.reset = function() {
	term.print(CSI + 'm');
}

return term;
