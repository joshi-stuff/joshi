const generate = require('../generate.js');

return function OPAQUE() {
	const def = {};

	function raw_pop_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return (
			'static ' +
			T +
			' duk_get_' +
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

		return [
			raw_pop_decl(type_name, types) + ' {',
			'	' + T + ' value;',
			'	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof(' +
				T +
				'));',
			'	return value;',
			'}',
		];
	};

	function raw_push_decl(type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return (
			'static void duk_push_' +
			ST +
			'(duk_context* ctx, ' +
			T +
			' value);'
		);
	}

	def.push_decl = function (type_name, types) {
		const T = type_name;
		const ST = generate.sid(T);

		return [
			'#define duk_push_' +
				ST +
				'(ctx,value) ' +
				'memcpy(duk_push_fixed_buffer(ctx,sizeof(' +
				T +
				')),&(value),sizeof(' +
				T +
				'))',
		];
	};

	def.push_gen = function (type_name, types) {
		return [];
	};

	def.pop_var = function (v, is_pointer, IDX, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer opaque variables not supported');
		}

		return [VAR + ' = duk_get_' + ST + '(ctx, ' + IDX + ');'];
	};

	def.push_var = function (v, is_pointer, types) {
		const VAR = v.name;
		const T = v.type;
		const ST = generate.sid(T);

		if (is_pointer) {
			throw new Error('Pointer opaque variables not supported');
		}

		return ['duk_push_' + ST + '(ctx, ' + VAR + ');'];
	};

	return def;
};
