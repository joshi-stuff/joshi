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

extern duk_context* _joshi_duk_context;

duk_ret_t _joshi_read_file(duk_context* ctx);

duk_ret_t duk_throw_errno(duk_context* ctx);

#endif
