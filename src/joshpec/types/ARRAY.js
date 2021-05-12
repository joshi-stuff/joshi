const generate = require('../generate.js');

return function ARRAY(IT) {
	const def = {};

	function raw_pop_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return (
			'static JOSHI_MBLOCK* duk_get_' +
			ST +
			'(duk_context* ctx, duk_idx_t idx)'
		);
	}

	def.pop_decl = function (type_name, types) {
		return [raw_pop_decl(type_name, types) + ';'];
	};

	def.pop_gen = function (type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			raw_pop_decl(type_name, types) + ' {',
			generate.tabify(1, [
				'duk_size_t length = duk_get_length(ctx, idx);',
				'JOSHI_MBLOCK* blk = joshi_mblock_alloc(ctx, length*sizeof(' +
					IT +
					'));',
				IT + '* value = (' + IT + '*)blk->data;',
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
				'return blk;',
			]),
			'}'
		);
	};

	function raw_push_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return (
			'static void duk_push_' +
			ST +
			'(duk_context* ctx, JOSHI_MBLOCK* blk)'
		);
	}

	def.push_decl = function (type_name, types) {
		return [raw_push_decl(type_name, types) + ';'];
	};

	def.push_gen = function (type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [].concat(
			raw_push_decl(type_name, types) + ' {',
			generate.tabify(1, [
				'duk_size_t length = blk->size / sizeof(' + IT + ');',
				IT + '* value = (' + IT + '*)blk->data;',
				'',
				'duk_push_array(ctx);',
				'for (duk_idx_t i = 0; i < length; i++) {',
				generate.tabify(
					1,
					generate.push_variable(
						{ type: IT, name: 'value[i]' },
						types
					)
				),
				'	duk_put_prop_index(ctx, -2, i);',
				'}',
			]),
			'}'
		);
	};

	def.decl_var = function (v, as_pointer, types) {
		if (as_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return ['JOSHI_MBLOCK* ' + v.name + ';'];
	};

	def.pop_var = function (v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return [VAR + ' = duk_get_' + ST + '(ctx, ' + IDX + ');'];
	};

	def.push_var = function (v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer array variables not supported');
		}

		return ['duk_push_' + ST + '(ctx, ' + VAR + ');'];
	};

	def.ref_var = function (v, types) {
		const VAR = v.name;
		const T = v.type;

		return ['((' + IT + '*)' + VAR + '->data)'];
	};

	return def;
};
