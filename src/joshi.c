#include <stdio.h>
#include <stdlib.h>

#include "duktape.h"
#include "duk_console.h"
#include "duk_module_node.h"
#include "load_file.h"

static void fatal_handler(void *udata, const char *msg);

void main(int argc, char *argv[]) {
	// Check CLI invocation
	if (argc < 2) {
		fprintf(stderr, "No script file name provided.\n");
		exit(-1);
	}

	// Init context
	duk_context *ctx = duk_create_heap(NULL, NULL, NULL, NULL, fatal_handler);

	if (!ctx) {
		fprintf(stderr, "Cannot allocate heap.\n");
		exit(-1);
	}

	// Init built-ins
	duk_console_init(ctx, 0);
	duk_module_node_init(ctx);
	
	// Execute file
	load_file(ctx, argv[1]);
	int retval = duk_module_node_peval_main(ctx, argv[1]);

	// Cleanup and exit
	duk_destroy_heap(ctx);

	if (retval == -1) {
		fprintf(stderr, "Cannot execute program.\n");
		exit(-1);
	}

	exit(retval);
}

static void fatal_handler(void *udata, const char *msg) {
	(void) udata;  /* ignored in this case, silence warning */

	/* Note that 'msg' may be NULL. */
	fprintf(stderr, "Unhandled error: %s.\n", (msg ? msg : "(no message)"));
	fflush(stderr);

	exit(-1);
}
