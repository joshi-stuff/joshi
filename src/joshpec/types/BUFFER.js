const generate = require('../generate.js');

return function BUFFER() {
	const def = {};

	def.pop_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'#define duk_get_'+ST+'(ctx,idx) ' +
				'(('+T+')duk_require_buffer_data((ctx),(idx),NULL))'
		];
	}

	def.pop_gen = function(type_name, types) {
		return [];
	}

	def.push_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		// If one day we need push support for buffers we must turn it into a
		// JOSHI_MBLOCK type so that we keep track of its size
		//
		return [
			'/* duk_push_'+ST+': buffer types do not need/have push support */'
		];
	}

	def.push_gen = function(type_name, types) {
		return [];
	}

	def.pop_var = function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer buffer variables not supported');
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	}

	return def;
}


