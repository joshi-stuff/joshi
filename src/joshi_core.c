#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include "joshi_core.h"

BUILTIN joshi_core_builtins[] = {
	{ name: "compile_function", func: _joshi_compile_function, argc: 2 },
	{ name: "printk", func: _joshi_printk, argc: 1 },
	{ name: "read_file", func: _joshi_read_file, argc: 1 },
	{ name: "realpath", func: _joshi_realpath, argc: 1 },
}; 

size_t joshi_core_builtins_count = sizeof(joshi_core_builtins)/sizeof(BUILTIN);

//
// High level builtins
//
duk_ret_t _joshi_compile_function(duk_context* ctx) {

	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	return 1;
}

duk_ret_t _joshi_printk(duk_context* ctx) {
	const char* msg = duk_get_string(ctx, 0);

	// TODO: make sure to write all bytes
	write(2, msg, strlen(msg));

	return 0;
}

duk_ret_t _joshi_read_file(duk_context* ctx) {
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

// This one is needed to run spec, so we need to register it manually
duk_ret_t _joshi_realpath(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);

	char resolved_name[PATH_MAX+1];
	realpath(filepath, resolved_name);

	duk_push_string(ctx, resolved_name);
	return 1;
}


//
// Helpers
//
duk_ret_t duk_dump_stack(duk_context* ctx) {
	int idx_top = duk_get_top_index(ctx);

	if (idx_top == DUK_INVALID_INDEX) {
	    fprintf(stderr, "<empty>\n");
	} else {
		for(int i=idx_top; i>=0; i--) {
			int typei = duk_get_type(ctx, i);

			char *type = NULL;

			switch(typei) {
				case DUK_TYPE_NONE: type = "none"; break;
				case DUK_TYPE_UNDEFINED: type = "undefined"; break;
				case DUK_TYPE_NULL: type = "null"; break;
				case DUK_TYPE_BOOLEAN: type = "boolean"; break;
				case DUK_TYPE_NUMBER: type = "number"; break;
				case DUK_TYPE_STRING: type = "string"; break;
				case DUK_TYPE_OBJECT: type = "object"; break;
				case DUK_TYPE_BUFFER: type = "buffer"; break;
				case DUK_TYPE_POINTER: type = "pointer"; break;
				case DUK_TYPE_LIGHTFUNC: type = "lightfunc"; break;
			}

			if (type == NULL) {
				fprintf(stderr, "%d: %d ???\n", i, typei);
			} else {
				fprintf(stderr, "%d: %s\n", i, type);
			}
		}
	}
}

duk_ret_t duk_throw_errno(duk_context* ctx) {
	int err = errno;
	
	int idx = duk_push_error_object(ctx, DUK_ERR_ERROR, strerror(err));
	duk_push_int(ctx, err);
	duk_put_prop_string(ctx, idx, "errno");
	
	return duk_throw(ctx);
}
