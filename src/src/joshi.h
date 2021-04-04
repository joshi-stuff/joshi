#ifndef _JOSHI_H
#define _JOSHI_H

#include "duktape.h"

extern duk_context* _joshi_duk_context;

duk_ret_t joshi_dump_stack(duk_context* ctx);
duk_ret_t joshi_throw_syserror(duk_context* ctx);

size_t cnv_cesu_to_utf_length(const char* cesu);
void cnv_cesu_to_utf(const char* cesu, char* utf);
void cnv_nonbpm_uc_to_utf(unsigned int x, char utf[4]);
void cnv_nonbpm_uc_to_cesu(unsigned int x, char cesu[6]);
unsigned int cnv_nonbpm_cesu_to_uc(const char cesu[6]);
unsigned int cnv_nonbpm_utf_to_uc(const char utf[4]);

typedef struct {
	const char* name;
	void* func;
	int argc;
} JOSHI_FN_DECL;

/* The global symbol names and types  to be exported in .so modules */
#define JOSHI_FN_DECLS_SO_SYMBOL /* JOSHI_FN_DECL[] */ "joshi_fn_decls" 
#define JOSHI_FN_DECLS_COUNT_SO_SYMBOL /* size_t */ "joshi_fn_decls_count"

#endif
