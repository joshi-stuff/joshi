#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include "joshi_core.h"

duk_ret_t duk_dump_stack(duk_context* ctx);
duk_ret_t duk_throw_errno(duk_context* ctx);

duk_context* _joshi_duk_context;

static int _joshi_atexit_handler_set = 0;

//
// Internal helper functions
//
static void _joshi_atexit_handler(void) {
	duk_context* ctx = _joshi_duk_context;

	duk_push_heap_stash(ctx);

	// ... stash
	
	duk_get_prop_string(ctx, -1, "atexit_handler");

	// ... stash func
	
	duk_remove(ctx, -2);

	// ... func

	duk_call(ctx, 0);
}

static void _joshi_signal_handler(int sig) {
	duk_context* ctx = _joshi_duk_context;

	duk_push_heap_stash(ctx);

	// ... stash
	
	duk_get_prop_string(ctx, -1, "signal_handlers");

	// ... stash signal_handlers
	
	duk_get_prop_index(ctx, -1, sig);

	// ... stash func
	
	duk_remove(ctx, -2);

	// ... func

	duk_push_int(ctx, sig);
	duk_call(ctx, 1);
}

//
// High level builtins
//
duk_ret_t _joshi_atexit(duk_context* ctx) {
	if (_joshi_atexit_handler_set) {
		errno  = EINVAL;
		return duk_throw_errno(ctx);
	}
	else {
		_joshi_atexit_handler_set = 1;
	}

	duk_push_heap_stash(ctx);

	// ... func stash

	duk_pull(ctx, -2);

	// ... stash func

	duk_put_prop_string(ctx, -2, "atexit_handler");
	duk_pop(ctx);

	int result = atexit(_joshi_atexit_handler);
	
	if (result == -1) {
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, result);
	return 1;
}

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

duk_ret_t _joshi_signal(duk_context* ctx) {
	int sig = (int)duk_get_number(ctx, 0);

	void (*func)(int);

	switch (duk_get_type(ctx, 1)) {
		case DUK_TYPE_UNDEFINED:
			func = SIG_DFL;
			break;

		case DUK_TYPE_NULL:
			func = SIG_IGN;
			break;

		default:
			func = _joshi_signal_handler;

			duk_push_heap_stash(ctx);

			// ... func stash
			
			if (!duk_get_prop_string(ctx, -1, "signal_handlers")) {

				// ... func stash undefined
				
				duk_pop(ctx); 

				// ... func stash
				
				duk_push_array(ctx);

				// ... func stash array
				
				duk_put_prop_string(ctx, -2, "signal_handlers");

				// ... func stash 
				
				duk_get_prop_string(ctx, -1, "signal_handlers");

				// ... func stash signal_handlers

				duk_remove(ctx, -2);

				// ... func signal_handlers
			}

			duk_pull(ctx, -2);

			// ... signal_handlers func

			duk_put_prop_index(ctx, -2, sig);

			// ... signal_handlers 
			
			duk_pop(ctx);

			// ... func 
			
			break;
	}

	if (signal(sig, func) == SIG_ERR) {
		duk_throw_errno(ctx);
	}

	return 0;
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

	const char* errmsg = strerror(err);

	char msg[128 + strlen(errmsg)];
	sprintf(msg, "Syscall error %d: %s", err, errmsg);

	int idx = duk_push_error_object(ctx, DUK_ERR_ERROR, msg);
	duk_push_int(ctx, err);
	duk_put_prop_string(ctx, idx, "errno");
	
	return duk_throw(ctx);
}

//
// Table of builtins
//
BUILTIN joshi_core_builtins[] = {
	{ name: "atexit", func: _joshi_atexit, argc: 1 },
	{ name: "compile_function", func: _joshi_compile_function, argc: 2 },
	{ name: "printk", func: _joshi_printk, argc: 1 },
	{ name: "read_file", func: _joshi_read_file, argc: 1 },
	{ name: "realpath", func: _joshi_realpath, argc: 1 },
	{ name: "signal", func: _joshi_signal, argc: 2 },
}; 

size_t joshi_core_builtins_count = sizeof(joshi_core_builtins)/sizeof(BUILTIN);

