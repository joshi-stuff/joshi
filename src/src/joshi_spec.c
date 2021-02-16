#include <stdlib.h> 
#include <string.h> 
 
#include <fcntl.h> 
#include <poll.h> 
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
 
duk_ret_t _joshi_spec_execv(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* pathname = (char*)duk_get_string(ctx, 0); 
	duk_size_t argv_length = duk_get_length(ctx, 1);
	char* argv[argv_length];
	for (duk_size_t i = 0; i < argv_length; i++) {
		duk_get_prop_index(ctx, 1, i);
		argv[i] = (char*)duk_get_string(ctx, -1);
		duk_pop(ctx);
	} 
 
	/* Syscall invocation */ 
	int ret = execv( 
		pathname, 
		argv 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_execvp(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* file = (char*)duk_get_string(ctx, 0); 
	duk_size_t argv_length = duk_get_length(ctx, 1);
	char* argv[argv_length];
	for (duk_size_t i = 0; i < argv_length; i++) {
		duk_get_prop_index(ctx, 1, i);
		argv[i] = (char*)duk_get_string(ctx, -1);
		duk_pop(ctx);
	} 
 
	/* Syscall invocation */ 
	int ret = execvp( 
		file, 
		argv 
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
	/* Output-only arguments instantiation */ 
	int fildes[2]; 
 
	/* Syscall invocation */ 
	int ret = pipe( 
		fildes 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return marshalling */ 
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
 
duk_ret_t _joshi_spec_poll(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	duk_size_t fds_length = duk_get_length(ctx, 0);
	struct pollfd fds[fds_length];
	for (duk_size_t i = 0; i < fds_length; i++) {
		duk_get_prop_index(ctx, 0, i);

		duk_get_prop_string(ctx, -1, "fd");
		fds[i].fd = (int)duk_get_number(ctx, -1);
		duk_pop(ctx);

		duk_get_prop_string(ctx, -1, "events");
		fds[i].events = (short int)duk_get_number(ctx, -1);
		duk_pop(ctx);

		duk_get_prop_string(ctx, -1, "revents");
		fds[i].revents = (short int)duk_get_number(ctx, -1);
		duk_pop(ctx);

		duk_pop(ctx);
	} 
	nfds_t nfds = (nfds_t)duk_get_number(ctx, 1); 
	int timeout = (int)duk_get_number(ctx, 2); 
 
	/* Output-only arguments instantiation */ 
 
 
	/* Syscall invocation */ 
	int ret = poll( 
		fds, 
		nfds, 
		timeout 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return marshalling */ 
	for (size_t i = 0; i < fds_length; i++) {
		duk_get_prop_index(ctx, 0, i);

		duk_push_int(ctx, fds[i].fd);
		duk_put_prop_string(ctx, -2, "fd");

		duk_push_int(ctx, fds[i].events);
		duk_put_prop_string(ctx, -2, "events");

		duk_push_int(ctx, fds[i].revents);
		duk_put_prop_string(ctx, -2, "revents");

		duk_pop(ctx);
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

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
 
	/* Output-only arguments instantiation */ 
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
 
	/* Output arguments return marshalling */ 
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
	{ name: "execv", func: _joshi_spec_execv, argc: 2 }, 
	{ name: "execvp", func: _joshi_spec_execvp, argc: 2 }, 
	{ name: "exit", func: _joshi_spec_exit, argc: 1 }, 
	{ name: "fork", func: _joshi_spec_fork, argc: 0 }, 
	{ name: "open", func: _joshi_spec_open, argc: 2 }, 
	{ name: "pipe", func: _joshi_spec_pipe, argc: 1 }, 
	{ name: "poll", func: _joshi_spec_poll, argc: 3 }, 
	{ name: "read", func: _joshi_spec_read, argc: 3 }, 
	{ name: "waitpid", func: _joshi_spec_waitpid, argc: 3 }, 
	{ name: "write", func: _joshi_spec_write, argc: 3 }, 
}; 
 
size_t joshi_spec_builtins_count = sizeof(joshi_spec_builtins)/sizeof(BUILTIN); 