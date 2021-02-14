const println = require('term').println;

const spec = require('./joshi.spec.js');

// TODO: rename ref:true as out:true
// rename refgen and prgen as outPreGen and outPostGen
// rename gen to inPreGen and create an inPostGen function (for structs, f.e.)
// rename jtype to retGen

function genGetBufferData(ctype) {
	return function(arg, argPos) {
		const name = getArgName(arg);

		return (
			ctype + ' ' + name + ' = (' + ctype + ')' +
				'duk_get_buffer_data(ctx, ' + argPos + ', NULL);'
		);
	}
}

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
	'nfds_t': {
		gen: 'duk_get_number',
		jtype: 'number'
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
	'struct pollfd*': {
		gen: genGetBufferData('struct pollfd*')
	},
	'unsigned': {
		jtype: 'number'
	},
	'void*': {
		gen: genGetBufferData('void*'),
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
println('#include <stdlib.h>');
println('#include <string.h>');
println('');
for (var i=0; i<includes.length; i++) {
	println('#include <' + includes[i] + '>');
}
println('');
println('#include "joshi_spec.h"');

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
	println('');
	println('duk_ret_t _joshi_spec_' + scName + '(duk_context* ctx) {');

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

			println(tabify(generateArg(arg, argPos++)));
		}
	}

	//
	// Byref arguments construction
	//
	if (getRefArgsCount(sc) > 0 ) {
		var argPos = 0;

		println('');
		for(var j=0; j<argc; j++) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			println(tabify(generateRefArg(arg, argPos++)));
		}
	}

	//
	// Invocation
	//
	const rtype = getRetType(sc);
	const rassign = (rtype === 'void' ? '' : rtype + ' ret = ');

	println('');
	println('	' + rassign + scName + '(');
	for (var j=0; j<argc; j++) {
		const arg = sc[j];
		const sep = (j < argc - 1) ? ',' : '';

		println('		' + getArgName(arg) + sep);
	}
	println('	);');
	
	//
	// Byref arguments push
	//
	if (getRefArgsCount(sc) > 0 ) {
		var argPos = 0;

		println('');
		for(var j=0; j<argc; j++) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			println(tabify(generatePushRefArg(arg, argPos++)));
		}
	}

	//
	// Error check
	//
	const rtype = getRetType(sc);

	if (getThrows(sc) && (rtype !== 'void')) {
		println('');
		println('	if (ret == -1) {');
		println('		return duk_throw_errno(ctx);');
		println('	}');
	}

	//
	// Return
	//
	const rtype = getRetType(sc);

	println('');

	if (rtype === 'void') {
		println('	return 0;');
	} else if (getRefArgsCount(sc) === 0) {
		const rtypedef = TYPEDEFS_MAP[rtype];
		const rjtype = rtypedef.jtype;

		println('	duk_push_' + rjtype + '(ctx, ret);');
		println('');
		println('	return 1;');
	} else {
		const rtypedef = TYPEDEFS_MAP[rtype];
		const rjtype = rtypedef.jtype;

		println('	duk_push_object(ctx);');
		println('');
		println('	duk_push_' + rjtype + '(ctx, ret);');
		println('	duk_put_prop_string(ctx, -2, "value");');
		println('');

		for(var j=argc-1; j>=0; j--) {
			const arg = sc[j];

			if (!arg.ref) {
				continue;
			}

			const name = getArgName(arg);

			println('	duk_pull(ctx, -2);');
			println('	duk_put_prop_string(ctx, -2, "' + name + '");');
		}

		println('');
		println('	return 1;');
	}

	//
	// End of function
	//
	println('}');
}

//
// BUILTINs table
//
println('');
println('BUILTIN joshi_spec_builtins[] = {');
for(var i=0; i<scNames.length; i++) {
	const scName = scNames[i];
	const sc = scs[scName];

	println(
		'	{ name: "' + scName + '", func: _joshi_spec_' + scName + 
		', argc: ' + getArgsCount(sc) + ' },');
}
println('};');
println('');
println('size_t joshi_spec_builtins_count = sizeof(joshi_spec_builtins)/sizeof(BUILTIN);');
