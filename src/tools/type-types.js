const generate = require('./generate.js');
const util = require('./util.js');

function ARRAY(IT) {return {
	pop_decl: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'duk_blk* duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx)';
	},
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			'duk_size_t length = duk_get_length(ctx, idx);',
			'duk_blk* blk = duk_malloc(ctx, length*sizeof('+IT+'));',
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
		);
	},
	push_decl: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'void duk_push_'+ST+'(duk_context* ctx, duk_blk* blk)';
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			'duk_size_t length = blk->size / sizeof('+IT+');',
			IT+'* value = ('+IT+'*)blk->data;',
			'',
			'duk_push_array(ctx);',
			'for (duk_idx_t i = 0; i < length; i++) {',
			generate.tabify(
				1,
				generate.push_variable({ type: IT, name: 'value[i]' }, types)
			),
			'	duk_put_prop_index(ctx, -2, i);',
			'}'
		);
	},
	decl_var:  function(v, as_pointer, types) {
		if (as_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return [
			'duk_blk* '+v.name+';'
		];
	},
	pop_var: function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	},
	push_var: function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	},
	ref_var: function(v, types) {
		const VAR = v.name;
		const T = v.type;

		return [
			'(('+IT+'*)'+VAR+'->data)'
		];
	}
}}

function ATOMIC(JT, nullable) {return {
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		const lines = [];

		if (nullable) {
			lines = lines.concat(
				'if (duk_is_null(ctx, idx) || duk_is_undefined(ctx, idx)) {',
				'	return NULL;',
				'}',
				''
			);
		}

		return lines.concat(
			'return ('+T+')duk_require_'+JT+'(ctx, idx);'
		);
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'duk_push_'+JT+'(ctx, value);',
		];
	},
	pop_var: function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			VAR = '*('+VAR+')';
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	},
	push_var: function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			VAR = '*('+VAR+')';
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	},
}}

function BUILTIN(JT) {
	const ret = ATOMIC(JT);

	ret.pop_decl =
	ret.push_decl = function() {
		return '';
	}

	ret.pop_gen =
	ret.push_gen = function() {
		return [];
	}

	return ret;
}

function BUFFER() {return {
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'return ('+T+')duk_require_buffer_data(ctx, idx, NULL);',
		];
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		// If one day we need push support for buffers we must turn it into a
		// duk_blk type so that we keep track of its size
		//
		return [
			'/* duk_push_'+ST+': buffer types do not need/have push support */'
		];
	},
	pop_var: function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer buffer variables not supported');
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	},
}}

function OPAQUE() {return {
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			T+' value;',
			'memcpy(&value, ' +
				'duk_require_buffer_data(ctx, idx, NULL), ' + 
				'sizeof('+T+'));',
			'return value;',
		];
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'memcpy(duk_push_fixed_buffer(ctx, sizeof('+T+')), ' + 
				'&value, sizeof('+T+'));',
		];
	},
	pop_var: function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer opaque variables not supported');
		}

		return [
			VAR+' = duk_get_'+ST+'(ctx, '+IDX+');'
		];
	},
	push_var: function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer opaque variables not supported');
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');'
		];
	},
}}

function STRING() {return {
	decl_var: function(v, as_pointer, types) {
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
			'char '+VAR+'['+variable.length+'];'
		];
	},
	pop_decl: function(type_name, types) {
		return 'void duk_get_char_arr(duk_context* ctx, duk_idx_t idx, char out_value[])';
	},
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		return [
			'strcpy(out_value, duk_require_string(ctx, idx));',
		];
	},
	push_decl: function(type_name, types) {
		return 'void duk_push_char_arr(duk_context* ctx, char value[])';
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		if (T !== 'char[]') {
			throw new Error('String type can only be applied to char[]');
		}

		return [
			'duk_push_string(ctx, value);',
		];
	},
	pop_var: function(v, is_pointer, IDX, types) {
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
			'strcpy('+VAR+', duk_get_string(ctx, '+IDX+'));'
		];
	},
	push_var: function(v, is_pointer, types) {
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
			'duk_push_string(ctx, '+VAR+');'
		];
	},
}}

function STRUCT(fields) {return {
	pop_decl: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'void duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx, '+T+'* value)'; 
	},
	pop_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			fields.reduce(function(lines, field) {
				const F = field.name;

				return lines.concat(
					'	duk_get_prop_string(ctx, idx, "'+F+'");',
					generate.tabify(
						1, 
						generate.pop_variable(
							util.prefix_var_name('value->', field), 
							types
						)
					),
					'	duk_pop(ctx);'
				);
			}, [])
		);
	},
	push_decl: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return 'void duk_push_'+ST+'(duk_context* ctx, '+T+'* value)';
	},
	push_gen: function(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			'duk_push_object(ctx);',
			fields.reduce(function(lines, field) {
				const F = field.name;

				return lines.concat(
					generate.tabify(
						1, 
						generate.push_variable(
							util.prefix_var_name('value->', field),
							types
						)
					),
					'	duk_put_prop_string(ctx, -2, "'+F+'");'
				);
			}, [])
		);
	},
	pop_var: function(v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (!is_pointer) {
			VAR = '&('+VAR+')';
		}

		return [
			'duk_get_'+ST+'(ctx, '+IDX+', '+VAR+');'
		];
	},
	push_var: function(v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (!is_pointer) {
			VAR = '&('+VAR+')';
		}

		return [
			'duk_push_'+ST+'(ctx, '+VAR+');',
		];
	},
}};

return {
	ARRAY: ARRAY,
	ATOMIC: ATOMIC,
	BUILTIN: BUILTIN,
	BUFFER: BUFFER,
	OPAQUE: OPAQUE,
	STRING: STRING,
	STRUCT: STRUCT,
};
