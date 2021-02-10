#ifndef _JOSHI_CORE_H
#define _JOSHI_CORE_H

#include "duktape.h"

typedef struct {
	const char* name;
	void* func;
	int argc;
} BUILTIN;

#define JOSHI_CORE_BUILTINS_COUNT 4

// TODO: rename all bultin functions (as _joshi_exit) to avoid collisions
duk_ret_t compile_function(duk_context* ctx);
duk_ret_t _joshi_exit(duk_context* ctx);
duk_ret_t read_file(duk_context* ctx);
duk_ret_t resolve_path(duk_context* ctx);

extern BUILTIN joshi_core_builtins[JOSHI_CORE_BUILTINS_COUNT]; 

#endif
