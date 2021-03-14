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

size_t cnv_cesu_to_utf_length(const char* cesu);
void cnv_cesu_to_utf(const char* cesu, char* utf);
void cnv_nonbpm_uc_to_utf(unsigned int x, char utf[4]);
void cnv_nonbpm_uc_to_cesu(unsigned int x, char cesu[6]);
unsigned int cnv_nonbpm_cesu_to_uc(const char cesu[6]);
unsigned int cnv_nonbpm_utf_to_uc(const char utf[4]);

#endif
