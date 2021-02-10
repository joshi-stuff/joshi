#include <stdio.h>
#include <stdlib.h>

#include "joshi_core.h"

BUILTIN joshi_core_builtins[JOSHI_CORE_BUILTINS_COUNT] = {
	{
		name: "compile_function",
		func: compile_function,
		argc: 2
	},
	{
		name: "read_file",
		func: read_file,
		argc: 1
	},
	{
		name: "resolve_path",
		func: resolve_path,
		argc: 1
	},
}; 


// [ ... source filename ] -> [ ... function ]
duk_ret_t compile_function(duk_context* ctx) {
	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	return 1;
}

// [ ... filepath ] -> [ ... contents ]
duk_ret_t read_file(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);
	
	FILE *f = fopen(filepath, "rb");

	if (!f) {
		duk_push_error_object(
			ctx, DUK_ERR_ERROR, "Cannot read file: %s", filepath);
		return duk_throw(ctx);
	}

	fseek(f, 0, SEEK_END);          
	int flen = ftell(f);            
	rewind(f);            

	char *contents = malloc(flen+1);
	fread(contents, 1, flen, f); 
	contents[flen] = 0;
	fclose(f);

	duk_push_string(ctx, contents);
	free(contents);
	
	return 1;
}

// [ ... filepath ] -> [ ... filepath ]
duk_ret_t resolve_path(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);

	char resolved_name[PATH_MAX+1];
	realpath(filepath, resolved_name);

	duk_push_string(ctx, resolved_name);

	return 1;
}






