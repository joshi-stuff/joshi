const generate = require('../generate.js');

function prefix_var_name(prefix, v) {
	const nv = Object.assign({}, v);

	nv.name = prefix + v.name;

	return nv;
}

return function STRUCT(fields) {
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
						prefix_var_name('value->', field), 
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
						prefix_var_name('value->', field),
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

