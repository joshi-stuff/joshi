const generate = require('./generate.js');
const util = require('./util.js');

function ARRAY(IT) {
	const def = {};

	function raw_pop_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static JOSHI_MBLOCK* duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx)';
	}

	def.pop_decl = function(type_name, types) {
		return [
			raw_pop_decl(type_name, types) + ';'
		]
	}

	def.pop_gen = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			raw_pop_decl(type_name, types) + ' {',
			generate.tabify(1, [
				'duk_size_t length = duk_get_length(ctx, idx);',
				'JOSHI_MBLOCK* blk = joshi_mblock_alloc(ctx, length*sizeof('+IT+'));',
				IT+'* value = ('+IT+'*)blk->data;',
				'',
				'for (duk_idx_t i = 0; i < length; i++) {',
				'	duk_get_prop_index(ctx, idx, i);',
				generate.tabify(
					1,
					generate.pop_variable({ type: IT, name: 'value[i]' }, types)
				),
				'	duk_pop(ctx);',
				'}',
				'',
				'return blk;'
			]),
			'}'
		);
	}

	function raw_push_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static void duk_push_'+ST+'(duk_context* ctx, JOSHI_MBLOCK* blk)';
	}

	def.push_decl = function(type_name, types) {
		return [
			raw_push_decl(type_name, types) + ';'
		];
	}

	def.push_gen = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			raw_push_decl(type_name, types) + ' {',
			generate.tabify(1, [
				'duk_size_t length = blk->size / sizeof('+IT+');',
				IT+'* value = ('+IT+'*)blk->data;',
				'',
				'duk_push_array(ctx);',
				'for (duk_idx_t i = 0; i < length; i++) {',
				generate.tabify(1,
					generate.push_variable({ type: IT, name: 'value[i]' }, types)
				),
				'	duk_put_prop_index(ctx, -2, i);',
				'}'
			]),
			'}'
		);
	}

	def.decl_var = function(v, as_pointer, types) {
		if (as_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return [
			'JOSHI_MBLOCK* '+v.name+';'
		];
	}

	def.pop_var = function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer array variables not supported');
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
			throw new Error('Pointer array variables not supported');
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	}

	def.ref_var = function(v, types) {
		const VAR = v.name;
		const T = v.type;

		return [
			'(('+IT+'*)'+VAR+'->data)'
		];
	}

	return def;
}

function ATOMIC(JT, nullable) {
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

function BUILTIN(JT) {
	const def = ATOMIC(JT);

	def.pop_decl =
	def.push_decl = function() {
		return [];
	}

	def.pop_gen =
	def.push_gen = function() {
		return [];
	}

	return def;
}

function BUFFER() {
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

function OPAQUE() {
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
			'	'+T+' value;',
			'	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof('+T+'));',
			'	return value;',
			'}'
		];
	}

	function raw_push_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static void duk_push_'+ST+'(duk_context* ctx, '+T+' value);';
	}

	def.push_decl = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'#define duk_push_'+ST+'(ctx,value) ' +
				'memcpy(duk_push_fixed_buffer(ctx,sizeof('+T+')),&(value),sizeof('+T+'))'
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
			throw new Error('Pointer opaque variables not supported');
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
			throw new Error('Pointer opaque variables not supported');
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	}

	return def;
}

function STRING() {
	const def = {};

	def.decl_var = function(v, as_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const LENGTH = v.length;

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		if (as_pointer) {
			throw new Error('Pointer string variables not supported');
		}

		return [
			'char '+VAR+'['+v.length+'];'
		];
	}

	def.pop_decl = function(type_name, types) {
		return [
			'#define duk_get_char_arr(ctx,idx,out_value)' +
				' cnv_cesu_to_utf(require_string((ctx),(idx)),(out_value))'
		];
	}

	def.pop_gen = function(type_name, types) {
		return [];
	}

	def.push_decl = function(type_name, types) {
		return [
			// TODO: UTF to CES conversion ?
			'#define duk_push_char_arr(ctx,value) duk_push_string((ctx),(value))'
		];
	}

	def.push_gen = function(type_name, types) {
		return [];
	}

	def.pop_var = function(v, is_pointer, IDX, types) {
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
			'cnv_cesu_to_utf(duk_get_string(ctx, '+IDX+'), '+VAR+');'
		];
	}

	def.push_var = function(v, is_pointer, types) {
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
			'duk_push_string(ctx, '+VAR+');'
		];
	}

	return def;
}

function STRING_PT() {
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

function STRUCT(fields) {
	const def = {};

	function raw_pop_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static void duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx, '+T+'* value)'; 
	}

	def.pop_decl = function(type_name, types) {
		return [
			raw_pop_decl(type_name, types) + ';'
		];
	}

	def.pop_gen = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		const lines = [
			raw_pop_decl(type_name, types) + ' {',
		];

		fields.forEach(function(field) {
			const F = field.name;

			lines = lines.concat(
				'	duk_get_prop_string(ctx, idx, "'+F+'");',
				generate.tabify(1, 
					generate.pop_variable(
						util.prefix_var_name('value->', field), 
						types
					)
				),
				'	duk_pop(ctx);'
			);
		});

		return lines.concat(
			'}'
		);
	}

	function raw_push_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'static void duk_push_'+ST+'(duk_context* ctx, '+T+'* value)';
	}

	def.push_decl = function(type_name, types) {
		return [
			raw_push_decl(type_name, types) + ';'
		];
	}

	def.push_gen = function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		const lines = [
			raw_push_decl(type_name, types) + ' {',
			'	duk_push_object(ctx);',
		];

		fields.forEach(function(field) {
			const F = field.name;

			lines = lines.concat(
				generate.tabify(
					1, 
					generate.push_variable(
						util.prefix_var_name('value->', field),
						types
					)
				),
				'	duk_put_prop_string(ctx, -2, "'+F+'");'
			);
		});

		return lines.concat(
			'}'
		);
	}

	def.pop_var = function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (!is_pointer) {
			VAR = '&('+VAR+')';
		}

		return [
			'duk_get_'+ST+'(ctx, '+IDX+', '+VAR+');'
		];
	}

	def.push_var = function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (!is_pointer) {
			VAR = '&('+VAR+')';
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');',
		];
	}

	return def;
};

return {
	ARRAY: ARRAY,
	ATOMIC: ATOMIC,
	BUILTIN: BUILTIN,
	BUFFER: BUFFER,
	OPAQUE: OPAQUE,
	STRING: STRING,
	STRING_PT: STRING_PT,
	STRUCT: STRUCT,
};
