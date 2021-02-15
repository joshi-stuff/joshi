#include <stdlib.h> 
#include <string.h> 
 
#include <fcntl.h> 
#include <signal.h> 
#include <stdio.h> 
#include <string.h> 
#include <sys/stat.h> 
#include <sys/types.h> 
#include <sys/wait.h> 
#include <unistd.h> 
 
#include "joshi_core.h" 
#include "joshi_spec.h" 
 
duk_ret_t _joshi_spec_alarm(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int seconds = (int)duk_get_number(ctx, 0); 
 
	/* Syscall invocation */ 
	unsigned ret = alarm( 
		seconds 
	); 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_close(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fd = (int)duk_get_number(ctx, 0); 
 
	/* Syscall invocation */ 
	int ret = close( 
		fd 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_dup(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fildes = (int)duk_get_number(ctx, 0); 
 
	/* Syscall invocation */ 
	int ret = dup( 
		fildes 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_dup2(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fildes = (int)duk_get_number(ctx, 0); 
	int fildes2 = (int)duk_get_number(ctx, 1); 
 
	/* Syscall invocation */ 
	int ret = dup2( 
		fildes, 
		fildes2 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_exit(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int status = (int)duk_get_number(ctx, 0); 
 
	/* Syscall invocation */ 
	exit( 
		status 
	); 
 
	/* Return */ 
	return 0; 
} 
 
duk_ret_t _joshi_spec_fork(duk_context* ctx) { 
	/* Syscall invocation */ 
	pid_t ret = fork( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_open(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* pathname = (char*)duk_get_string(ctx, 0); 
	int flags = (int)duk_get_number(ctx, 1); 
 
	/* Syscall invocation */ 
	int ret = open( 
		pathname, 
		flags 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_pipe(duk_context* ctx) { 
	/* Output arguments retrieval */ 
	int fildes[2]; 
 
	/* Syscall invocation */ 
	int ret = pipe( 
		fildes 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return */ 
	duk_push_array(ctx);
	for (int i=0; i<2; i++) {
		duk_push_int(ctx, fildes[i]);
		duk_put_prop_index(ctx, -2, i);
	} 
 
	/* Return */ 
	duk_push_object(ctx);

	duk_push_number(ctx, ret);
	duk_put_prop_string(ctx, -2, "value");

	duk_pull(ctx, -2);
	duk_put_prop_string(ctx, -2, "fildes");

	return 1; 
} 
 
duk_ret_t _joshi_spec_read(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fd = (int)duk_get_number(ctx, 0); 
	void* buf = (void*)duk_get_buffer_data(ctx, 1, NULL); 
	size_t count = (size_t)duk_get_number(ctx, 2); 
 
	/* Syscall invocation */ 
	ssize_t ret = read( 
		fd, 
		buf, 
		count 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_waitpid(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	pid_t pid = (pid_t)duk_get_number(ctx, 0); 
	int options = (int)duk_get_number(ctx, 1); 
 
	/* Output arguments retrieval */ 
	int wstatus[1]; 
 
	/* Syscall invocation */ 
	pid_t ret = waitpid( 
		pid, 
		wstatus, 
		options 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return */ 
	duk_push_number(ctx, wstatus[0]); 
 
	/* Return */ 
	duk_push_object(ctx);

	duk_push_number(ctx, ret);
	duk_put_prop_string(ctx, -2, "value");

	duk_pull(ctx, -2);
	duk_put_prop_string(ctx, -2, "wstatus");

	return 1; 
} 
 
duk_ret_t _joshi_spec_write(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fd = (int)duk_get_number(ctx, 0); 
	void* buf = (void*)duk_get_buffer_data(ctx, 1, NULL); 
	size_t count = (size_t)duk_get_number(ctx, 2); 
 
	/* Syscall invocation */ 
	ssize_t ret = write( 
		fd, 
		buf, 
		count 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
BUILTIN joshi_spec_builtins[] = { 
	{ name: "alarm", func: _joshi_spec_alarm, argc: 1 }, 
	{ name: "close", func: _joshi_spec_close, argc: 1 }, 
	{ name: "dup", func: _joshi_spec_dup, argc: 1 }, 
	{ name: "dup2", func: _joshi_spec_dup2, argc: 2 }, 
	{ name: "exit", func: _joshi_spec_exit, argc: 1 }, 
	{ name: "fork", func: _joshi_spec_fork, argc: 0 }, 
	{ name: "open", func: _joshi_spec_open, argc: 2 }, 
	{ name: "pipe", func: _joshi_spec_pipe, argc: 1 }, 
	{ name: "read", func: _joshi_spec_read, argc: 3 }, 
	{ name: "waitpid", func: _joshi_spec_waitpid, argc: 3 }, 
	{ name: "write", func: _joshi_spec_write, argc: 3 }, 
}; 
 
size_t joshi_spec_builtins_count = sizeof(joshi_spec_builtins)/sizeof(BUILTIN); 
