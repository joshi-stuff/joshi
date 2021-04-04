#include <dlfcn.h>
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <termios.h>
#include <unistd.h>

#include "joshi_core.h"

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

	// ... stash signal_handlers func
	
	duk_remove(ctx, -2);

	// ... stash func

	duk_remove(ctx, -2);

	// ... func

	duk_push_int(ctx, sig);

	// ... func sig

	duk_call(ctx, 1);
}

//
// High level builtins
//
static duk_ret_t _joshi_atexit(duk_context* ctx) {
	if (_joshi_atexit_handler_set) {
		errno  = EINVAL;
		return joshi_throw_syserror(ctx);
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
		joshi_throw_syserror(ctx);
	}

	duk_push_int(ctx, result);
	return 1;
}

static duk_ret_t _joshi_compile_function(duk_context* ctx) {
	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	return 1;
}

static duk_ret_t _joshi_printk(duk_context* ctx) {
	const char* msg = duk_get_string(ctx, 0);

	// TODO: make sure to write all bytes
	write(2, msg, strlen(msg));

	return 0;
}

static duk_ret_t _joshi_read_file(duk_context* ctx) {
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

static duk_ret_t _joshi_realpath(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);

	char resolved_name[PATH_MAX+1];
	if (realpath(filepath, resolved_name) == NULL) {
		joshi_throw_syserror(ctx);
	}

	duk_push_string(ctx, resolved_name);
	return 1;
}
	
static duk_ret_t _joshi_require_so(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);

	void* handle = dlopen(filepath, RTLD_LAZY);

	if (!handle) {
		duk_push_error_object(ctx, DUK_ERR_ERROR, dlerror());
		return duk_throw(ctx);
	}

	JOSHI_FN_DECL* joshi_fn_decls = 
		(JOSHI_FN_DECL*)dlsym(handle, JOSHI_FN_DECLS_SO_SYMBOL);
	size_t joshi_fn_decls_count = 
		*(size_t*)dlsym(handle, JOSHI_FN_DECLS_COUNT_SO_SYMBOL);

	duk_push_object(ctx);

	for (size_t i = 0; i < joshi_fn_decls_count; i++) {
		JOSHI_FN_DECL* decl = joshi_fn_decls+i;

		duk_push_c_function(ctx, decl->func, decl->argc);
		duk_put_prop_string(ctx, -2, decl->name);
	}

	return 1;
}
	
static duk_ret_t _joshi_set_term_mode(duk_context* ctx) {
	static struct termios termios_modes[3];
	static int initialized = 0;

	if (!initialized) {
		errno = 0;
		if (tcgetattr(0, termios_modes+0) != 0) {
			joshi_throw_syserror(ctx);
		}

		memcpy(termios_modes+1, termios_modes+0, sizeof(struct termios));
		termios_modes[1].c_lflag &= ~ECHO;

		cfmakeraw(termios_modes+2);

		initialized = 1;
	}

	int mode = duk_require_int(ctx, 0);

	if (mode < 0 || mode > 2) {
		mode = 0;
	}

	errno = 0;
	if (tcsetattr(0, TCSANOW, termios_modes+mode) != 0) {
		joshi_throw_syserror(ctx);
	}

	return 0;
}

static duk_ret_t _joshi_signal(duk_context* ctx) {
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

			}

			// ... func stash signal_handlers

			duk_remove(ctx, -2);
			
			// ... func signal_handlers

			duk_pull(ctx, -2);

			// ... signal_handlers func

			duk_put_prop_index(ctx, -2, sig);

			// ... signal_handlers 
			
			duk_pop(ctx);

			// ... func 
			
			break;
	}

	if (signal(sig, func) == SIG_ERR) {
		joshi_throw_syserror(ctx);
	}

	return 0;
}

//
// Table of builtins
//
JOSHI_FN_DECL joshi_core_fn_decls[] = {
	{ name: "atexit", func: _joshi_atexit, argc: 1 },
	{ name: "compile_function", func: _joshi_compile_function, argc: 2 },
	{ name: "printk", func: _joshi_printk, argc: 1 },
	{ name: "read_file", func: _joshi_read_file, argc: 1 },
	{ name: "realpath", func: _joshi_realpath, argc: 1 },
	{ name: "require_so", func: _joshi_require_so, argc: 1 },
	{ name: "set_term_mode", func: _joshi_set_term_mode, argc: 1 },
	{ name: "signal", func: _joshi_signal, argc: 2 },
}; 

size_t joshi_core_fn_decls_count = sizeof(joshi_core_fn_decls)/sizeof(JOSHI_FN_DECL);

