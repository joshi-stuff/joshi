const generate = require('../generate.js');

return function CONSTANT() {
	const def = {};

	def.pop_decl = function(type_name, types) {
		return [];
	}

	def.pop_gen = function(type_name, types) {
		return [];
	}

	def.push_decl = function(type_name, types) {
		return [];
	}

	def.push_gen = function(type_name, types) {
		return [];
	}

	def.decl_var = function(v, as_pointer, types) {
		if (as_pointer) {
			throw new Error('Pointer constants not supported');
		}

		return [];
	}

	def.pop_var = function(v, is_pointer, IDX, types) {
		return [];
	}

	def.push_var = function(v, is_pointer, types) {
		throw new Error('Constants cannot be pushed');
	}

	def.ref_var = function(v, types) {
		const VAR = v.name;

		return [
			VAR
		];
	}

	return def;
}


