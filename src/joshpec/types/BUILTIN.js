const generate = require('../generate.js');
const ATOMIC = require('./ATOMIC.js');

return function BUILTIN(JT) {
	const def = ATOMIC(JT);

	def.pop_decl = def.push_decl = function () {
		return [];
	};

	def.pop_gen = def.push_gen = function () {
		return [];
	};

	return def;
};
