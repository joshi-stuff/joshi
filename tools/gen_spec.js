const spec = require('./joshi.spec.js');

const TYPEDEFS_MAP = {
	'char*': {
		gen: 'duk_get_string',
	},
	'int': {
		gen: 'duk_get_number',
		refgen: function(arg) {
			const name = getArgName(arg);

			return 'int ' + name + '[1];';
		},
		prgen: function(arg) {
			const name = getArgName(arg);

			return 'duk_push_int(ctx, ' + name + '[0]);';
		},
		jtype: 'number'
	},
	'int[]': {
		refgen: function(arg) {
			const name = getArgName(arg);

			return 'int ' + name + '[' + arg.size + '];';
		},
		prgen: function(arg) {
			const name = getArgName(arg);

			return (
				'duk_push_array(ctx);\n' +
				'for (int i=0; i<' + arg.size + '; i++) {\n' +
				'	duk_push_int(ctx, ' + name + '[i]);\n' +
				'	duk_put_prop_index(ctx, -2, i);\n' +
				'}'
			);
		}
	},
	'pid_t': {
		gen: 'duk_get_number',
		jtype: 'number'
	},
	'size_t': {
		gen: 'duk_get_number',
		jtype: 'number'
	},
	'ssize_t': {
		gen: 'duk_get_number',
		jtype: 'number'
	},
	'unsigned': {
		jtype: 'number'
	},
	'void*': {
		gen: function(arg, argPos) {
			const name = getArgName(arg);

			return (
				'void* ' + name + 
					' = duk_get_buffer_data(ctx, ' + argPos + ', NULL);'
			);
		},
		refgen: function(arg) {
			const name = getArgName(arg);

			return 'void* ' + name + ' = malloc(' + arg.size + ');'
		},
		prgen: function(arg) {
			const name = getArgName(arg);

			return (
				'memcpy(' + 
					'duk_push_fixed_buffer(ctx, ' + arg.size + '), ' + 
					name + ', ' +  
					arg.size + ');\n' +
				'free(' + name + ');'
			);
		}
	},
};

function getArgsCount(sc) {
	return sc.length - 1;
}

function getNonRefArgsCount(sc) {
	const argc = getArgsCount(sc);

	var count = 0;

	for(var i=0; i<argc; i++) {
		const arg = sc[i];

		if (!arg.ref) {
			count++;
		}
	}

	return count;
}

function getRefArgsCount(sc) {
	const argc = getArgsCount(sc);

	var count = 0;

	for(var i=0; i<argc; i++) {
		const arg = sc[i];

		if (arg.ref) {
			count++;
		}
	}

	return count;
}

function getArgType(arg) {
	const keys = Object.keys(arg);

	for(var i=0; i<keys.length; i++) {
		const type = keys[i];

		if (TYPEDEFS_MAP[type]) {
			return type;
		}
	}

	throw new Error('Unknown argument type for argument: ' + keys);
}

function getArgName(arg) {
	const type = getArgType(arg);

	return arg[type];
}

function getArgTypedef(arg) {
	const type = getArgType(arg);

	return TYPEDEFS_MAP[type];
}

function getRetType(sc) {
	return sc[sc.length-1].returns;
}

function getThrows(sc) {
	const throws = sc[sc.length-1].throws;

	if (throws === undefined) {
		return true;
	}

	return throws;
}

function generateArg(arg, argPos) {
	const type = getArgType(arg);
	const typedef = getArgTypedef(arg);
	
	const gen = typedef.gen;

	if (typeof gen === 'string') {
		const name = getArgName(arg);

		return type + ' ' + name + ' = ' + 
			'(' + type + ')' + gen + '(ctx, ' + argPos + ');';
	}

	if (typeof gen === 'function') {
		return gen(arg, argPos);
	}

	throw new Error('Invalid generator for type ' + type );
}

function generateRefArg(arg, argPos) {
	const type = getArgType(arg);
	const typedef = getArgTypedef(arg);
	
	const gen = typedef.refgen;

	if (typeof gen === 'function') {
		return gen(arg, argPos);
	}

	throw new Error('Invalid ref generator for type ' + type );
}

function generatePushRefArg(arg, argPos) {
	const type = getArgType(arg);
	const typedef = getArgTypedef(arg);
	
	const gen = typedef.prgen;

	if (typeof gen === 'function') {
		return gen(arg, argPos);
	}

	throw new Error('Invalid push ref generator for type ' + type );
}

function tabify(content) {
	return content
		.split('\n')
		.map(function(line) {
			return '	' + line;
		})
		.join('\n');
}

//
// Begin generation
//
const includes = spec.includes;
const scs = spec.syscalls;
const scNames = Object.keys(scs);

//
// Includes
//
console.log('#include <stdlib.h>');
console.log('#include <string.h>');
console.log('');
for (var i=0; i<includes.length; i++) {
	console.log('#include <' + includes[i] + '>');
}
console.log('');
console.log('#include "joshi_spec.h"');

//
// Stubs
//
for(var i=0; i<scNames.length; i++) {
	const scName = scNames[i];
	const sc = scs[scName];
	const argc = getArgsCount(sc);

	//
	// Header
	//
	console.log('');
	console.log('duk_ret_t _joshi_spec_' + scName + '(duk_context* ctx) {');

	//
	// Argument retrieval
	//
	if (getNonRefArgsCount(sc) > 0) {
		var argPos = 0;

		for(var j=0; j<argc; j++) {
			const arg = sc[j];

			if (arg.ref) {
				continue;
			}

			console.log(tabify(generateArg(arg, argPos++)));
		}
	}

	//
	// Byref arguments construction
	//
	if (getRefArgsCount(sc) > 0 ) {
		var argPos = 0;

		console.log('');
		for(var j=0; j<argc; j++) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			console.log(tabify(generateRefArg(arg, argPos++)));
		}
	}

	//
	// Invocation
	//
	const rtype = getRetType(sc);
	const rassign = (rtype === 'void' ? '' : rtype + ' ret = ');

	console.log('');
	console.log('	' + rassign + scName + '(');
	for (var j=0; j<argc; j++) {
		const arg = sc[j];
		const sep = (j < argc - 1) ? ',' : '';

		console.log('		' + getArgName(arg) + sep);
	}
	console.log('	);');
	
	//
	// Byref arguments push
	//
	if (getRefArgsCount(sc) > 0 ) {
		var argPos = 0;

		console.log('');
		for(var j=0; j<argc; j++) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			console.log(tabify(generatePushRefArg(arg, argPos++)));
		}
	}

	//
	// Error check
	//
	const rtype = getRetType(sc);

	if (getThrows(sc) && (rtype !== 'void')) {
		console.log('');
		console.log('	if (ret == -1) {');
		console.log('		return duk_throw_errno(ctx);');
		console.log('	}');
	}

	//
	// Return
	//
	const rtype = getRetType(sc);

	console.log('');

	if (rtype === 'void') {
		console.log('	return 0;');
	} else if (getRefArgsCount(sc) === 0) {
		const rtypedef = TYPEDEFS_MAP[rtype];
		const rjtype = rtypedef.jtype;

		console.log('	duk_push_' + rjtype + '(ctx, ret);');
		console.log('');
		console.log('	return 1;');
	} else {
		const rtypedef = TYPEDEFS_MAP[rtype];
		const rjtype = rtypedef.jtype;

		console.log('	duk_push_object(ctx);');
		console.log('');
		console.log('	duk_push_' + rjtype + '(ctx, ret);');
		console.log('	duk_put_prop_string(ctx, -2, "value");');
		console.log('');

		for(var j=argc-1; j>=0; j--) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			const name = getArgName(arg);

			console.log('	duk_pull(ctx, -2);');
			console.log('	duk_put_prop_string(ctx, -2, "' + name + '");');
		}

		console.log('');
		console.log('	return 1;');
	}

	//
	// End of function
	//
	console.log('}');
}

//
// BUILTINs table
//
console.log('');
console.log('BUILTIN joshi_spec_builtins[] = {');
for(var i=0; i<scNames.length; i++) {
	const scName = scNames[i];
	const sc = scs[scName];

	console.log(
		'	{ name: "' + scName + '", func: _joshi_spec_' + scName + 
		', argc: ' + getArgsCount(sc) + ' },');
}
console.log('};');
console.log('');
console.log('size_t joshi_spec_builtins_count = sizeof(joshi_spec_builtins)/sizeof(BUILTIN);');
