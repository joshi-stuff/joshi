const io = require('io');

const parse = {};

parse.asArgv = function(args) {
	if(args.length > 1) {
		const array = [];
		for (var i = 0; i < args.length; i++) {
			array.push(args[i]);
		}
		return array;
	} else if (args[0] === 'string') {
		return [args[0]];
	} else {
		throw new Error('Invalid arguments: ' + args);
	}
}

return parse;
