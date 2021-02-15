const util = {};

util.generateInArgPre = function(arg, argPos, def) {
	var source = '';

	const gen = def.in.pre;

	if (typeof gen === 'string') {
		source += arg.type + ' ' + arg.name + ' = ';
		source +='(' + arg.type + ')';
		source += gen + '(ctx, ' + argPos + ')';
		source += ';';
	} else if (typeof gen === 'function') {
		source += gen(arg, argPos);
	} else {
		throw new Error('Invalid in pre-generator for type ' + arg.type );
	}

	return util.tabify(source);
}

util.generateOutArgPre = function(arg, argPos, def) {
	var source = '';

	const gen = def.out.pre;

	if (typeof gen === 'function') {
		source += gen(arg, argPos);
	} else {
		throw new Error('Invalid out pre-generator for type ' + arg.type );
	}

	return util.tabify(source);
}

util.generateOutArgPost = function(arg, argPos, def) {
	var source = '';

	const gen = def.out.post;

	if (typeof gen === 'function') {
		source += gen(arg, argPos);
	} else {
		throw new Error('Invalid out post-generator for type ' + arg.type );
	}

	return util.tabify(source);
}

util.generateReturn = function(sc, defs) {
	var source = '';

	const ret = util.getReturn(sc);
	const outArgs = util.getOutArgs(sc);
	const retdef = defs[ret.returns];

	if (ret.returns === 'void') {
		source += 'return 0;';
	} else if (outArgs.length === 0) {
		if (!retdef.ret) {
			throw new Error('Invalid return generator for type ' + ret.returns); 
		}

		source += retdef.ret + '(ctx, ret);\n';
		source += '\n';
		source += 'return 1;';
	} else {
		if (!retdef.ret) {
			throw new Error('Invalid return generator for type ' + ret.returns); 
		}

		source += 'duk_push_object(ctx);\n';
		source += '\n';
		source += retdef.ret + '(ctx, ret);\n';
		source += 'duk_put_prop_string(ctx, -2, "value");\n';
		source += '\n';

		const args = util.getArgs(sc);

		for(var j = args.length - 1; j >= 0; j--) {
			const arg = args[j];

			if (!util.isOutArg(arg)) {
				continue;
			}

			source += 'duk_pull(ctx, -2);\n';
			source += 'duk_put_prop_string(ctx, -2, "' + arg.name + '");\n';
			source += '\n';
		}

		source += 'return 1;';
	}

	return util.tabify(source);
}

util.getArgs = function(sc) {
	return sc.filter(function(arg) {return !arg.returns;});
}

util.getInArgs = function(sc) {
	return util.getArgs(sc).filter(util.isInArg);
}

util.getOutArgs = function(sc) {
	return util.getArgs(sc).filter(util.isOutArg);
}

util.getReturn = function(sc) {
	return sc.filter(function(item) {return item.returns;})[0];
}

util.isInArg = function(arg) {
	return arg.in || (arg.in === undefined && arg.out === undefined);
}

util.isOutArg = function(arg) {
	return arg.out;
}

util.tabify = function(content) {
	return content
		.split('\n')
		.map(function(line) {
			return line === '' ? line : '	' + line;
		})
		.join('\n');
}

return util;
