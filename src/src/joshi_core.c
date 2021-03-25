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

duk_ret_t duk_dump_stack(duk_context* ctx);
duk_ret_t duk_throw_errno(duk_context* ctx);

duk_context* _joshi_duk_context;

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
duk_ret_t _joshi_atexit(duk_context* ctx) {
	if (_joshi_atexit_handler_set) {
		errno  = EINVAL;
		return duk_throw_errno(ctx);
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
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, result);
	return 1;
}

duk_ret_t _joshi_compile_function(duk_context* ctx) {
	duk_compile(ctx, DUK_COMPILE_FUNCTION);

	return 1;
}

duk_ret_t _joshi_printk(duk_context* ctx) {
	const char* msg = duk_get_string(ctx, 0);

	// TODO: make sure to write all bytes
	write(2, msg, strlen(msg));

	return 0;
}

duk_ret_t _joshi_read_file(duk_context* ctx) {
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

// This one is needed to run spec, so we need to register it manually
duk_ret_t _joshi_realpath(duk_context* ctx) {
	const char* filepath = duk_get_string(ctx, 0);

	char resolved_name[PATH_MAX+1];
	if (realpath(filepath, resolved_name) == NULL) {
		duk_throw_errno(ctx);
	}

	duk_push_string(ctx, resolved_name);
	return 1;
}
	
duk_ret_t _joshi_set_term_mode(duk_context* ctx) {
	static struct termios termios_modes[3];
	static int initialized = 0;

	if (!initialized) {
		errno = 0;
		if (tcgetattr(0, termios_modes+0) != 0) {
			duk_throw_errno(ctx);
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
		duk_throw_errno(ctx);
	}

	return 0;
}

duk_ret_t _joshi_signal(duk_context* ctx) {
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
		duk_throw_errno(ctx);
	}

	return 0;
}

//
// Helpers
//
duk_ret_t duk_dump_stack(duk_context* ctx) {
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

duk_ret_t duk_throw_errno(duk_context* ctx) {
	int err = errno;

	const char* errmsg = strerror(err);

	char msg[128 + strlen(errmsg)];
	sprintf(msg, "Syscall error %d: %s", err, errmsg);

	int idx = duk_push_error_object(ctx, DUK_ERR_ERROR, msg);
	duk_push_int(ctx, err);
	duk_put_prop_string(ctx, idx, "errno");
	
	return duk_throw(ctx);
}

// 
// Conversion helpers
//
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


//
// Table of builtins
//
BUILTIN joshi_core_builtins[] = {
	{ name: "atexit", func: _joshi_atexit, argc: 1 },
	{ name: "compile_function", func: _joshi_compile_function, argc: 2 },
	{ name: "printk", func: _joshi_printk, argc: 1 },
	{ name: "read_file", func: _joshi_read_file, argc: 1 },
	{ name: "realpath", func: _joshi_realpath, argc: 1 },
	{ name: "set_term_mode", func: _joshi_set_term_mode, argc: 1 },
	{ name: "signal", func: _joshi_signal, argc: 2 },
}; 

size_t joshi_core_builtins_count = sizeof(joshi_core_builtins)/sizeof(BUILTIN);

