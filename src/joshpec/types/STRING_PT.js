const generate = require('../generate.js');

return function STRING_PT() {
	const def = {};

	function raw_pop_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static '+T+' duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx)';
	}

	def.pop_decl = function(type_name, types) {
		return [ 
			raw_pop_decl(type_name, types) + ';'
		];
	}

	def.pop_gen = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			raw_pop_decl(type_name, types) + ' {',
			'	if (duk_is_null(ctx, idx) || duk_is_undefined(ctx, idx)) {',
			'		return NULL;',
			'	}',
			'',
			'	const char* cesu = duk_require_string(ctx, idx);',
			'	JOSHI_MBLOCK* blk = joshi_mblock_alloc(ctx, cnv_cesu_to_utf_length(cesu) + 1);',
			'	char* utf = (char*)blk->data;',
			'',
			'	cnv_cesu_to_utf(cesu, utf);',
			'',
			'	return utf;',
			'}'
		];
	}

	def.push_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'#define duk_push_'+ST+'(ctx,value) duk_push_string((ctx),(value))'
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

