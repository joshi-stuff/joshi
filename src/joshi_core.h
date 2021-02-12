#ifndef _JOSHI_CORE_H
#define _JOSHI_CORE_H

#include "duktape.h"

typedef struct {
	const char* name;
	void* func;
	int argc;
} BUILTIN;

extern size_t joshi_core_builtins_count;
extern BUILTIN joshi_core_builtins[]; 

// High level builtins
duk_ret_t _joshi_compile_function(duk_context* ctx);
duk_ret_t _joshi_read_file(duk_context* ctx);
duk_ret_t _joshi_realpath(duk_context* ctx);

// Development helpers
duk_ret_t duk_dump_stack(duk_context* ctx);
duk_ret_t duk_throw_errno(duk_context* ctx);

#endif
