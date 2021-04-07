const generate = require('../generate.js');

return function ATOMIC(JT, nullable) {
	const def = {};

	def.pop_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		if (nullable) {
			return [
				'#define duk_get_'+ST+'(ctx,idx) ' +
				'(' +
					'duk_is_null((ctx),(idx))||duk_is_undefined((ctx),(idx))' + 
					'?NULL' +
					':('+T+')duk_require_'+JT+'((ctx),(idx))' + 
				')'
			];
		}
		else {
			return [
				'#define duk_get_'+ST+'(ctx,idx) duk_require_'+JT+'((ctx),(idx))' 
			];
		}
	}

	def.pop_gen = function(type_name, types) {
		return [];
	}

	def.push_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'#define duk_push_'+ST+'(ctx,value) duk_push_'+JT+'((ctx),(value))'
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
			VAR = '*('+VAR+')';
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	}

	def.push_var = function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			VAR = '*('+VAR+')';
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	}	

	return def;
}

