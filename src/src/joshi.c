#include <stdio.h>
#include <stdlib.h>

#include "duktape.h"
#include "joshi_core.h"
#include "joshi_spec.h"

// This is patched by release script, don't touch
#define VERSION "1.0.0"

const char* LIB_DIR = "/usr/lib/joshi";

static int joshi_run(
	duk_context *ctx, const char* filepath, int argc, const char *argv[]);
static void fatal_handler(void *udata, const char *msg);

void main(int argc, const char *argv[]) {
	// Show version when asked
	if (argc >= 2 && !strcmp(argv[1], "-v")) {
		fprintf(stderr, "%s\n", VERSION);
		exit(0);
	}

	// Init LIB_DIR
	const char* joshi_lib_dir = getenv("JOSHI_LIB_DIR");

	if (joshi_lib_dir != NULL) {
		LIB_DIR = joshi_lib_dir;
	}

	// Init context
	duk_context *ctx = duk_create_heap(NULL, NULL, NULL, NULL, fatal_handler);

	if (!ctx) {
		fprintf(stderr, "Cannot allocate heap.\n");
		exit(-1);
	}

	_joshi_duk_context = ctx;

	// Populate joshi object
	int retval = joshi_run(ctx, argc>=2 ? argv[1] : NULL, argc, argv);

	// Don't cleanup before exit because atexit would crash
	// duk_destroy_heap(ctx);

	exit(retval);
}

static int joshi_run(
	duk_context *ctx, const char* filepath, int argc, const char *argv[]) {

	// Load init.js file
	char init_path[PATH_MAX+1];

	strcpy(init_path, LIB_DIR);
	strcat(init_path, "/init.js");

	duk_push_c_function(ctx, _joshi_read_file, 1);
	duk_push_string(ctx, init_path);
	duk_call(ctx, 1);

	duk_push_string(ctx, init_path);

	// [ ... source filepath ]

	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	// [ ... init ]

	duk_push_global_object(ctx);

	// [ ... init global]

	// Populate joshi object
	
	int idx = duk_push_object(ctx);

	for(int i=0; i<joshi_core_builtins_count; i++) {
		BUILTIN* bin = joshi_core_builtins+i;

		duk_push_c_function(ctx, bin->func, bin->argc);
		duk_put_prop_string(ctx, idx, bin->name);
	}

	for(int i=0; i<joshi_spec_builtins_count; i++) {
		BUILTIN* bin = joshi_spec_builtins+i;

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

static void fatal_handler(void *udata, const char *msg) {
	(void) udata;  /* ignored in this case, silence warning */

	/* Note that 'msg' may be NULL. */
	fprintf(stderr, "Unhandled error: %s.\n", (msg ? msg : "(no message)"));
	fflush(stderr);

	exit(-1);
}

