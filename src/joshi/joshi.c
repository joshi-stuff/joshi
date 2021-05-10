#include <errno.h>
#include <libgen.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include "joshi.h"
#include "joshi_core.h"

// This is patched by release script, don't touch
#define VERSION "1.6.1"

char LIB_DIR[1024];

duk_context* _joshi_duk_context;

static void fatal_handler(void *udata, const char *msg);
static int run_js(
	duk_context *ctx, const char* filepath, int argc, const char *argv[]);

void main(int argc, const char *argv[]) {
	// Show version when asked
	if (argc >= 2 && !strcmp(argv[1], "-v")) {
		fprintf(stderr, "%s\n", VERSION);
		exit(0);
	}

	// Init LIB_DIR
	const char* joshi_lib_dir = getenv("JOSHI_LIB_DIR");

	if (joshi_lib_dir != NULL) {
		strcpy(LIB_DIR, joshi_lib_dir);
	}
	else {
		readlink("/proc/self/exe", LIB_DIR, sizeof(LIB_DIR));
		dirname(LIB_DIR);
		dirname(LIB_DIR);
		strcat(LIB_DIR, "/lib/joshi");
	}

	// Init context
	duk_context *ctx = duk_create_heap(NULL, NULL, NULL, NULL, fatal_handler);

	if (!ctx) {
		fprintf(stderr, "Cannot allocate heap.\n");
		exit(-1);
	}

	_joshi_duk_context = ctx;

	// Run script file
	int retval = run_js(ctx, argc>=2 ? argv[1] : NULL, argc, argv);

	// Don't cleanup before exit because atexit would crash
	// duk_destroy_heap(ctx);

	exit(retval);
}

JOSHI_MBLOCK* joshi_mblock_alloc(duk_context* ctx, duk_size_t size) {
	duk_push_heap_stash(ctx);
	duk_get_prop_string(ctx, -1, "_joshi_mblocks");

	if (duk_is_undefined(ctx, -1)) {
		duk_pop(ctx);
		duk_push_array(ctx);
		duk_put_prop_string(ctx, -2, "_joshi_mblocks");
		duk_get_prop_string(ctx, -1, "_joshi_mblocks");
	}

	JOSHI_MBLOCK* mblock = 
		duk_push_fixed_buffer(ctx, sizeof(duk_size_t) + size);
	mblock->size = size;
	duk_put_prop_index(ctx, -2, duk_get_length(ctx, -2));
	duk_pop_2(ctx);

	return mblock;
}

void joshi_mblock_free_all(duk_context* ctx) {
	duk_push_heap_stash(ctx);
	duk_del_prop_string(ctx, -1, "_joshi_mblocks");
	duk_pop(ctx);
}

void cnv_cesu_to_utf(const char* cesu, char* utf) {
	unsigned const char* pc = cesu;
	unsigned char* pu = utf;

	while (*pc) {
		if (*pc == 0xED) {
			cnv_nonbpm_uc_to_utf(cnv_nonbpm_cesu_to_uc(pc), pu);

			pc += 6;
			pu += 4;
		}
		else {
			*pu = *pc;

			pc++;
			pu++;
		}
	}

	*pu = 0;
}

size_t cnv_cesu_to_utf_length(const char* cesu) {
	size_t len = 0;

	while(*cesu) {
		if (*cesu == 0xED) {
			len += 4;
			cesu += 6;
		}
		else {
			len++;
			cesu++;
		}
	}

	return len;
}

void cnv_nonbpm_uc_to_utf(unsigned int x, char utf[4]) {
	utf[0] = 0xF0 | ((x & 0x1C0000) >> 18);
	utf[1] = 0x80 | ((x & 0x3F000) >> 12);
	utf[2] = 0x80 | ((x & 0xFC0) >> 6);
	utf[3] = 0x80 | (x & 0x3F);
}

void cnv_nonbpm_uc_to_cesu(unsigned int x, char cesu[6]) {
	cesu[0] = 0xED;
	cesu[1] = 0xA0 | (((x & 0x1F0000) -1) >> 16);
	cesu[2] = 0x80 | ((x & 0xFC00) >> 10);
	cesu[3] = 0xED;
	cesu[4] = 0xB0 | ((x & 0x3C0) >> 6);
	cesu[5] = 0x80 | (x & 0x3F);
}

unsigned int cnv_nonbpm_cesu_to_uc(const char cesu[6]) {
	unsigned char a = (cesu[1] + 1) & 0x1F; // 5 bits
	unsigned char b = cesu[2] & 0x3F;		// 6 bits
	unsigned char c = cesu[4] & 0x0F;		// 4 bits
	unsigned char d = cesu[5] & 0x3F;		// 6 bits

	unsigned int x = 0;
	x |= a << 16;
	x |= b << 10;
	x |= c << 6;
	x |= d;

	return x;
}

unsigned int cnv_nonbpm_utf_to_uc(const char utf[4]) {
	unsigned char a = utf[0] & 0x07; // 3 bits
	unsigned char ab = utf[1] & 0x3F; // 6 bits
	unsigned char bc = utf[2] & 0x3F; // 6 bits
	unsigned char d = utf[3] & 0x3F; // 6 bits

	unsigned int x = 0;
	x |= a << 18;
	x |= ab << 12;
	x |= bc << 6;
	x |= d;

	return x;
}

duk_ret_t joshi_dump_stack(duk_context* ctx) {
	int idx_top = duk_get_top_index(ctx);

	if (idx_top == DUK_INVALID_INDEX) {
	    fprintf(stderr, "<empty>\n");
	} else {
		for(int i=idx_top; i>=0; i--) {
			int type = duk_get_type(ctx, i);

			switch(type) {
				case DUK_TYPE_NONE:
					fprintf(stderr, "%d: (none)\n", i);
					break;

				case DUK_TYPE_UNDEFINED:
					fprintf(stderr, "%d: (undefined)\n", i);
					break;

				case DUK_TYPE_NULL:
					fprintf(stderr, "%d: (null)\n", i);
					break;

				case DUK_TYPE_BOOLEAN:
					fprintf(stderr, "%d: boolean %d\n", i, duk_get_boolean(ctx, i));
					break;

				case DUK_TYPE_NUMBER: 
					fprintf(stderr, "%d: number %f\n", i, duk_get_number(ctx, i));
					break;

				case DUK_TYPE_STRING:
					fprintf(stderr, "%d: string '%s'\n", i, duk_get_string(ctx, i));
					break;

				case DUK_TYPE_OBJECT:
					if (duk_has_prop_string(ctx, i, "call")) {
						duk_get_prop_string(ctx, i, "name");
						const char* name = duk_get_string(ctx, -1);
						duk_pop(ctx);

						fprintf(
							stderr, 
							"%d: function %s\n", 
							i, 
							name ? name : "???"
						);
					} else {
						fprintf(stderr, "%d: object { ", i);

						duk_enum(ctx, i, DUK_ENUM_OWN_PROPERTIES_ONLY);
						while (duk_next(ctx, -1, 0)) {
							fprintf(stderr, "%s ", duk_get_string(ctx, -1));
							duk_pop(ctx);  
						}
						duk_pop(ctx);

						fprintf(stderr, "}\n");
					}
					break;

				case DUK_TYPE_BUFFER:
					fprintf(stderr, "%d: buffer\n", i);
					break;

				case DUK_TYPE_POINTER:
					fprintf(stderr, "%d: pointer\n", i);
					break;

				case DUK_TYPE_LIGHTFUNC:
					fprintf(stderr, "%d: (light function)\n", i);
					break;

				default:
					fprintf(stderr, "%d: (unknown type: %d)\n", i, type);
					break;
			}
		}
	}
}

duk_ret_t joshi_throw_syserror(duk_context* ctx) {
	int err = errno;

	const char* errmsg = strerror(err);

	char msg[128 + strlen(errmsg)];
	sprintf(msg, "Syscall error %d: %s", err, errmsg);

	int idx = duk_push_error_object(ctx, DUK_ERR_ERROR, msg);
	duk_push_int(ctx, err);
	duk_put_prop_string(ctx, idx, "errno");
	
	return duk_throw(ctx);
}

static void fatal_handler(void *udata, const char *msg) {
	(void) udata;  /* ignored in this case, silence warning */

	/* Note that 'msg' may be NULL. */
	fprintf(stderr, "Unhandled error: %s.\n", (msg ? msg : "(no message)"));
	fflush(stderr);

	exit(-1);
}

static void push_file_contents(duk_context* ctx, const char* filepath) {
	FILE *f = fopen(filepath, "rb");

	if (!f) {
		duk_push_error_object(
			ctx, DUK_ERR_ERROR, "Cannot read file: %s", filepath);
		duk_throw(ctx);
		return;
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
}

static int run_js(
	duk_context *ctx, const char* filepath, int argc, const char *argv[]) {

	// Load init.js file
	char init_path[PATH_MAX+1];

	strcpy(init_path, LIB_DIR);
	strcat(init_path, "/init.js");

	push_file_contents(ctx, init_path);
	duk_push_string(ctx, init_path);

	// [ ... source filepath ]

	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	// [ ... init ]

	duk_push_global_object(ctx);

	// [ ... init global]

	// Populate joshi object
	
	int idx = duk_push_object(ctx);

	duk_push_c_function(ctx, joshi_dump_stack, 0);
	duk_put_prop_string(ctx, idx, "dump_stack");

	duk_push_c_function(ctx, joshi_throw_syserror, 0);
	duk_put_prop_string(ctx, idx, "throw_syserror");

	for(int i=0; i<joshi_fn_decls_count; i++) {
		JOSHI_FN_DECL* bin = joshi_fn_decls+i;

		duk_push_c_function(ctx, bin->func, bin->argc);
		duk_put_prop_string(ctx, idx, bin->name);
	}

	duk_push_string(ctx, LIB_DIR);
	duk_put_prop_string(ctx, idx, "dir");

	duk_push_string(ctx, VERSION);
	duk_put_prop_string(ctx, idx, "version");

	// [ ... init global joshi ]

	if (filepath) {
		duk_push_string(ctx, filepath);
	} 
	else {
		duk_push_null(ctx);
	}

	for( int i=0; i<argc; i++) {
		duk_push_string(ctx, argv[i]);
	}

	// [ ... init global joshi filepath arg0 ... argN ]
	
	// Launch init()	
	
	duk_call(ctx, 3 + argc);

	// [ ... retval ]
	
	int retval = (int)duk_get_number(ctx, -1);
	duk_pop(ctx);
	
	// [ ... ]

	return retval;
}

