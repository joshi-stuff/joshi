const fs = require('fs');

// TODO: support custom code block enclosed in comments

const generate = require('./generate.js');

// Generators
function generate_pop_push_declarations(types) {
	return Object.keys(types).reduce(function(lines, typeName) {
		return lines.concat(
			generate.pop_declaration(typeName, types),
			generate.push_declaration(typeName, types)
		);
	}, []);
}

function generate_pop_push_functions(types) {
	return Object.keys(types).reduce(function(lines, typeName) {
		const popLines = generate.pop_function(typeName, types);
		const pushLines = generate.push_function(typeName, types);

		if (popLines.length !== 0) {
			popLines.push('');
		}

		if (pushLines.length !== 0) {
			pushLines.push('');
		}

		return lines.concat(
			popLines,
			pushLines
		);
	}, []);
}

function generate_stubs(functions, throws, types) {
	return Object.keys(functions).reduce(function(lines, fnName) {
		return lines.concat(
			generate.stub(fnName, functions, throws, types),
			''
		);
	}, []);
}

// Main loop
function main(argv) {
	if (argv.length != 3) {
		println2('usage: joshi spec.js <output dir>');
		proc.exit(1);
	}

	const out = argv[2];

	const dir = './specs';
	const functions = require(dir+'/functions.js');
	const throws = require(dir+'/throws.js');
	const types = require(dir+'/types.js');

	// TODO: Normalize input data //////////////////////////////////////////////
	Object.values(functions).forEach(function(fn) {
		if (fn.returns && !fn.returns.name) {
			fn.returns.name = 'ret_value';
		}
	});
	////////////////////////////////////////////////////////////////////////////

	const lines = [].concat(
	);

	fs.write_file(
		out+'/joshi_spec.c', 
		[].concat(
			require('./specs/header.js'),
			'',
			'#include "joshi_spec.h"', 
			'',
			'typedef struct duk_blk {',
			'	duk_size_t size;',
			'	char data[];',
			'} duk_blk;',
			'',
			generate_pop_push_declarations(types),
			'',
			'static duk_blk* duk_malloc(duk_context* ctx, duk_size_t size) {',
			'	duk_push_heap_stash(ctx);',
			'	duk_get_prop_string(ctx, -1, "_malloc_area");',
			'',
			'	if (duk_is_undefined(ctx, -1)) {',
			'		duk_pop(ctx);',
			'		duk_push_array(ctx);',
			'		duk_put_prop_string(ctx, -2, "_malloc_area");',
			'		duk_get_prop_string(ctx, -1, "_malloc_area");',
			'	}',
			'',
			'	duk_blk* ret_value = ',
			'		duk_push_fixed_buffer(ctx, sizeof(duk_size_t) + size);',
			'	ret_value->size = size;',
			'	duk_put_prop_index(ctx, -2, duk_get_length(ctx, -2));',
			'	duk_pop_2(ctx);',
			'',
			'	return ret_value;',
			'}',
			'',
			'static void duk_free_all(duk_context* ctx) {',
			'	duk_push_heap_stash(ctx);',
			'	duk_del_prop_string(ctx, -1, "_malloc_area");',
			'	duk_pop(ctx);',
			'}',
			'',
			generate_pop_push_functions(types),
			generate_stubs(functions, throws, types),
			'',
			'JOSHI_FN_DECL joshi_spec_fn_decls[] = {',
			generate.tabify(
				1,
				Object.entries(functions).reduce(function(lines, entry) {
					const FN = entry[0];
					const fn = entry[1];

					return lines.concat(
						'{ name: "'+FN+'", func: _joshi_spec_'+FN+
							', argc: '+fn.args.length+' },'
					);
				}, [])
			),
			'};',
			'',
			'size_t joshi_spec_fn_decls_count = ' + Object.keys(functions).length + ';' 
		).join('\n')
	);
}

main(argv);
