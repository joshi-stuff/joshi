const generate = {};

generate.checkReturn = function(fn, throws, types, cleanup_code) {
	const throwName = fn.throws;
	const chk_ret = throws[throwName];

	return chk_ret(fn.returns, types, cleanup_code);
}

generate.declareVariable = function(v, types, as_pointer) {
	const type = types[v.type];
	const decl_var = type.decl_var;

	if (decl_var) {
		return decl_var(v, as_pointer, types);
	}
	else {
		const T = as_pointer ? (v.type+'*') : v.type;
		const VAR = v.name;

		return [
			T+' '+VAR+';'
		];
	}
}

generate.popDeclaration = function(typeName, types) {
	const type = types[typeName];
	const pop_decl = type.pop_decl;

	var code;

	if (pop_decl) {
		code = pop_decl(typeName, types);
	}
	else {
		const T = typeName;
		const ST = generate.sid(T);

		code = T+' duk_get_'+ST+'(duk_context* ctx, duk_idx_t idx)';
	}

	if (!code.length) {
		return [];
	}

	return [ 'static ' + code ];
}

generate.popFunction = function(typeName, types) {
	const type = types[typeName];
	const pop_gen = type.pop_gen;

	const lines = pop_gen(typeName, types);

	if (!lines.length) {
		return [];
	}

	return [].concat(
		generate.popDeclaration(typeName, types)+' {',
		generate.tabify(
			1,
			lines	
		),
		'}'
	);
}

generate.popVariable = function(v, types, idx, is_pointer) {
	if (idx === undefined) {
		idx = -1;
	}
	
	const type = types[v.type];
	const pop_var = type.pop_var;

	return pop_var(v, !!is_pointer, idx, types);
}

generate.pushDeclaration = function(typeName, types) {
	const type = types[typeName];
	const push_decl = type.push_decl;

	var code;

	if (push_decl) {
		code = push_decl(typeName, types);
	}
	else {
		const T = typeName;
		const ST = generate.sid(T);

		code = 'void duk_push_'+ST+'(duk_context* ctx, '+T+' value)';
	}

	if (!code.length) {
		return [];
	}

	return [ 'static ' + code ];

}

generate.pushFunction = function(typeName, types) {
	const type = types[typeName];
	const push_gen = type.push_gen;

	const lines = push_gen(typeName, types);

	if (!lines.length) {
		return [];
	}

	return [].concat(
		generate.pushDeclaration(typeName, types)+' {',
		generate.tabify(
			1, 
			lines		
		),
		'}'
	);
}

generate.pushVariable = function(v, types, is_pointer) {
	const type = types[v.type];
	const push_var = type.push_var;

	return push_var(v, !!is_pointer, types);
}

generate.referenceVariable = function(v, types, mode) {
	const type = types[v.type];
	const ref_var = type.ref_var;

	const VAR = ref_var ? ref_var(v, types) : v.name;

	if (!mode) {
		return VAR;
	} 
	else {
		return mode+'('+VAR+')';
	}
}

generate.sid = function(name) {
	return name.replace('[]', '_arr').replace('*', '_pt').replace(' ', '_');
}

generate.stub = function(fnName, functions, throws, types) {
	const FN = fnName;
	
	const fn = functions[fnName];
	const args = fn.args;
	const inArgs  = args.filter(function(arg) {return !arg.out || arg.in_out});
	const outArgs  = args.filter(function(arg) {return arg.out || arg.in_out});
	const retVar = fn.returns;
	
	const lines = [].concat(
		'static duk_ret_t _joshi_spec_'+FN+'(duk_context* ctx) {',
		generate.tabify(
			1, 
			args.reduce(function(lines, arg, idx) {
				return lines.concat(
					generate.declareVariable(arg, types)
				);
			}, [])
		),
		'',
		generate.tabify(
			1, 
			inArgs.reduce(function(lines, arg, idx) {
				return lines.concat(
					generate.popVariable(arg, types, idx)
				);
			}, [])
		),
		'',
		'	errno = 0;',
		retVar ? [
			'	' + generate.declareVariable(retVar, types, retVar.ref),
			'	' + generate.referenceVariable(retVar, types) + ' = ',
		] : [],
		'',
		'	'+FN+'(' + 
			args.map(function(arg) {
				return generate.referenceVariable(
					arg, types, arg.ref ? '&' : null
				);
			}).join(',') +
			');',
		'',
		generate.tabify(
			1, 
			generate.checkReturn(fn, throws, types, [
				'duk_free_all(ctx);'	
			])
		),
		''
	);

	if (outArgs.length) {
		lines = lines.concat(
			'	duk_push_object(ctx);',
			generate.tabify(
				1, 
				outArgs.reduce(function(lines, arg) {
					return lines.concat(
						generate.pushVariable(arg, types),
						'duk_put_prop_string(ctx, -2, "'+arg.name+'");'
					);
				}, [])
			),
			retVar ? [
				'	'+generate.pushVariable(retVar, types, retVar.ref),
				'	duk_put_prop_string(ctx, -2, "value");'
			] : []
		)
	}
	else if (retVar) {
		lines = lines.concat(
			'	'+generate.pushVariable(retVar, types, retVar.ref)
		);
	}

	return lines.concat(
		'',
		'	duk_free_all(ctx);',
		retVar ? [
			'	return 1;' 
		] : [
			'	return 0;'
		],
		'}'
	);
}

generate.tabify = function(count, lines) {
	var indent = '';

	for (var i = 0; i < count; i++) {
		indent += '	';
	}

	return lines.map(function(line) {return indent + line;});
}

return generate;
