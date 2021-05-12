const generate = require('../generate.js');

return function STRING() {
	const def = {};

	def.decl_var = function (v, as_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const LENGTH = v.length;

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		if (as_pointer) {
			throw new Error('Pointer string variables not supported');
		}

		return ['char ' + VAR + '[' + v.length + '];'];
	};

	def.pop_decl = function (type_name, types) {
		return [
			'#define duk_get_char_arr(ctx,idx,out_value)' +
				' cnv_cesu_to_utf(require_string((ctx),(idx)),(out_value))',
		];
	};

	def.pop_gen = function (type_name, types) {
		return [];
	};

	def.push_decl = function (type_name, types) {
		return [
			// TODO: UTF to CES conversion ?
			'#define duk_push_char_arr(ctx,value) duk_push_string((ctx),(value))',
		];
	};

	def.push_gen = function (type_name, types) {
		return [];
	};

	def.pop_var = function (v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		if (is_pointer) {
			throw new Error('Pointer string variables not supported');
		}

		return [
			'cnv_cesu_to_utf(duk_get_string(ctx, ' + IDX + '), ' + VAR + ');',
		];
	};

	def.push_var = function (v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		if (is_pointer) {
			throw new Error('Pointer string variables not supported');
		}

		return [
			// TODO: UTF to CES conversion ?
			'duk_push_string(ctx, ' + VAR + ');',
		];
	};

	return def;
};
