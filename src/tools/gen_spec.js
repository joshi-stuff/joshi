const println = require('term').println;

const defs = require('./definitions.js');
const util = require('./util.js');

const spec = require('./joshi.spec.js');

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
println('#include "joshi_core.h"');
println('#include "joshi_spec.h"');

//
// Stubs
//
for(var i=0; i<scNames.length; i++) {
	const scName = scNames[i];
	const sc = scs[scName];
	const args = util.getArgs(sc);
	const inArgs = util.getInArgs(sc);
	const outArgs = util.getOutArgs(sc);
	const ret = util.getReturn(sc);

	//
	// Header
	//
	println('');
	println('duk_ret_t _joshi_spec_' + scName + '(duk_context* ctx) {');

	//
	// Input arguments pre generation
	//
	if (inArgs.length) {
		var argPos = 0;

		println('	/* Input arguments retrieval */');
		for(var j = 0; j < args.length; j++) {
			const arg = args[j];

			if (!util.isInArg(arg)) {
				continue;
			}

			println(util.generateInArgPre(arg, argPos, defs[arg.type]));

			argPos++;
		}
		println('');
	}

	//
	// Output arguments pre generation
	//
	if (outArgs.length) {
		var argPos = 0;

		println('	/* Output-only arguments instantiation */');
		for(var j = 0; j < args.length; j++) {
			const arg = args[j];

			if (!util.isOutArg(arg)) {
				continue;
			}

			println(util.generateOutArgPre(arg, argPos, defs[arg.type]));

			argPos++;
		}
		println('');
	}

	//
	// Invocation
	//
	const retAssign = (ret.returns === 'void' ? '' : ret.returns + ' ret = ');

	println('	/* Syscall invocation */');
	println('	' + retAssign + scName + '(');
	for (var j = 0; j < args.length; j++) {
		const arg = args[j];
		const sep = (j < args.length - 1) ? ',' : '';

		println('		' + arg.name + sep);
	}
	println('	);');
	println('');
	
	//
	// Error check
	//
	if ((ret.throws !== false) && (ret.returns !== 'void')) {
		println('	/* Error check */');
		println('	if (ret == -1) {');
		println('		return duk_throw_errno(ctx);');
		println('	}');
		println('');
	}

	//
	// Output arguments post generation
	//
	if (outArgs.length) {
		var argPos = 0;

		println('	/* Output arguments return marshalling */');
		for(var j = 0; j < args.length; j++) {
			const arg = args[j];

			if (!util.isOutArg(arg)) {
				continue;
			}

			println(util.generateOutArgPost(arg, argPos, defs[arg.type]));

			argPos++;
		}
		println('');
	}

	//
	// Return
	//
	println('	/* Return */');
	println(util.generateReturn(sc, defs));

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
for(var i = 0; i < scNames.length; i++) {
	const scName = scNames[i];
	const sc = scs[scName];

	println(
		'	{ name: "' + scName + '", func: _joshi_spec_' + scName + 
		', argc: ' + util.getArgs(sc).length + ' },');
}
println('};');
println('');
println('size_t joshi_spec_builtins_count = sizeof(joshi_spec_builtins)/sizeof(BUILTIN);');
