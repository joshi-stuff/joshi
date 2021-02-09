#include <stdio.h>

#include "load_file.h"

duk_ret_t load_file(duk_context* ctx, const char* path) {
	FILE *f = fopen(path, "rb");

	if (!f) {
		duk_push_error_object(
			ctx, DUK_ERR_ERROR, "Cannot load module: %s", path);
		return duk_throw(ctx);
	}

	fseek(f, 0, SEEK_END);          
	int flen = ftell(f);            
	rewind(f);            

	char *module_source = malloc(flen+1);
	fread(module_source, 1, flen, f); 
	module_source[flen] = 0;
	fclose(f);

	duk_push_string(ctx, module_source);

	free(module_source);

	return 0;
}
