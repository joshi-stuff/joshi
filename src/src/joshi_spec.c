#include <errno.h> 
#include <stdlib.h> 
#include <string.h> 
 
#include <dirent.h> 
#include <fcntl.h> 
#include <poll.h> 
#include <signal.h> 
#include <stdio.h> 
#include <string.h> 
#include <sys/random.h> 
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
	errno = 0; 
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
	errno = 0; 
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
 
duk_ret_t _joshi_spec_closedir(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	DIR* dirp;
	memcpy(&dirp, duk_get_buffer_data(ctx, 0, NULL), sizeof(dirp)); 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = closedir( 
		dirp 
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
	errno = 0; 
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
	errno = 0; 
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
	errno = 0; 
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
	errno = 0; 
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
	errno = 0; 
	exit( 
		status 
	); 
 
	/* Return */ 
	return 0; 
} 
 
duk_ret_t _joshi_spec_fork(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
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
 
duk_ret_t _joshi_spec_getegid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	uid_t ret = getegid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_getenv(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* name = (char*)duk_get_string(ctx, 0); 
 
	/* Syscall invocation */ 
	errno = 0; 
	char* ret = getenv( 
		name 
	); 
 
	/* Return */ 
	duk_push_string(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_geteuid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	uid_t ret = geteuid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_getgid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	uid_t ret = getgid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_getpid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	pid_t ret = getpid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_getrandom(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	void* buf = (void*)duk_get_buffer_data(ctx, 0, NULL); 
	size_t buflen = (size_t)duk_get_number(ctx, 1); 
	unsigned int flags = (unsigned int)duk_get_number(ctx, 2); 
 
	/* Output-only arguments instantiation */ 
 
 
	/* Syscall invocation */ 
	errno = 0; 
	ssize_t ret = getrandom( 
		buf, 
		buflen, 
		flags 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return marshalling */ 
	memcpy(duk_push_fixed_buffer(ctx, buflen), buf, buflen);
 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_getuid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	uid_t ret = getuid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_lseek(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	int fildes = (int)duk_get_number(ctx, 0); 
	off_t offset = (off_t)duk_get_number(ctx, 1); 
	int whence = (int)duk_get_number(ctx, 2); 
 
	/* Syscall invocation */ 
	errno = 0; 
	off_t ret = lseek( 
		fildes, 
		offset, 
		whence 
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
	mode_t mode = (mode_t)duk_get_number(ctx, 2); 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = open( 
		pathname, 
		flags, 
		mode 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_opendir(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* name = (char*)duk_get_string(ctx, 0); 
 
	/* Syscall invocation */ 
	errno = 0; 
	DIR* ret = opendir( 
		name 
	); 
 
	/* Error check */ 
	if (ret == NULL) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	memcpy(duk_push_fixed_buffer(ctx, sizeof(ret)), &ret, sizeof(ret));

	return 1; 
} 
 
duk_ret_t _joshi_spec_pipe(duk_context* ctx) { 
	/* Output-only arguments instantiation */ 
	int fildes[2]; 
 
	/* Syscall invocation */ 
	errno = 0; 
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
	errno = 0; 
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

		duk_push_number(ctx, fds[i].fd);
		duk_put_prop_string(ctx, -2, "fd");

		duk_push_number(ctx, fds[i].events);
		duk_put_prop_string(ctx, -2, "events");

		duk_push_number(ctx, fds[i].revents);
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
	errno = 0; 
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
 
duk_ret_t _joshi_spec_readdir(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	DIR* dirp;
	memcpy(&dirp, duk_get_buffer_data(ctx, 0, NULL), sizeof(dirp)); 
 
	/* Syscall invocation */ 
	errno = 0; 
	struct dirent* ret = readdir( 
		dirp 
	); 
 
	/* Error check */ 
	if (ret == NULL) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_object(ctx);

	duk_push_number(ctx, ret->d_ino);
	duk_put_prop_string(ctx, -2, "d_ino");

	duk_push_number(ctx, ret->d_off);
	duk_put_prop_string(ctx, -2, "d_off");

	duk_push_number(ctx, ret->d_reclen);
	duk_put_prop_string(ctx, -2, "d_reclen");

	duk_push_number(ctx, ret->d_type);
	duk_put_prop_string(ctx, -2, "d_type");

	duk_push_string(ctx, ret->d_name);
	duk_put_prop_string(ctx, -2, "d_name");


	return 1; 
} 
 
duk_ret_t _joshi_spec_setenv(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* name = (char*)duk_get_string(ctx, 0); 
	char* value = (char*)duk_get_string(ctx, 1); 
	int overwrite = (int)duk_get_number(ctx, 2); 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = setenv( 
		name, 
		value, 
		overwrite 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_setsid(duk_context* ctx) { 
	/* Syscall invocation */ 
	errno = 0; 
	pid_t ret = setsid( 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_sleep(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	unsigned int seconds = (unsigned int)duk_get_number(ctx, 0); 
 
	/* Syscall invocation */ 
	errno = 0; 
	unsigned int ret = sleep( 
		seconds 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_stat(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* pathname = (char*)duk_get_string(ctx, 0); 
 
	/* Output-only arguments instantiation */ 
	struct stat statbuf[1];
 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = stat( 
		pathname, 
		statbuf 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Output arguments return marshalling */ 
	duk_push_object(ctx);

	duk_push_number(ctx, statbuf->st_dev);
	duk_put_prop_string(ctx, -2, "st_dev");

	duk_push_number(ctx, statbuf->st_ino);
	duk_put_prop_string(ctx, -2, "st_ino");

	duk_push_number(ctx, statbuf->st_mode);
	duk_put_prop_string(ctx, -2, "st_mode");

	duk_push_number(ctx, statbuf->st_nlink);
	duk_put_prop_string(ctx, -2, "st_nlink");

	duk_push_number(ctx, statbuf->st_uid);
	duk_put_prop_string(ctx, -2, "st_uid");

	duk_push_number(ctx, statbuf->st_gid);
	duk_put_prop_string(ctx, -2, "st_gid");

	duk_push_number(ctx, statbuf->st_rdev);
	duk_put_prop_string(ctx, -2, "st_rdev");

	duk_push_number(ctx, statbuf->st_size);
	duk_put_prop_string(ctx, -2, "st_size");

	duk_push_number(ctx, statbuf->st_blksize);
	duk_put_prop_string(ctx, -2, "st_blksize");

	duk_push_number(ctx, statbuf->st_blocks);
	duk_put_prop_string(ctx, -2, "st_blocks");

	duk_push_number(ctx, statbuf->st_atim.tv_nsec);
	duk_put_prop_string(ctx, -2, "st_atim.tv_nsec");

	duk_push_number(ctx, statbuf->st_mtim.tv_nsec);
	duk_put_prop_string(ctx, -2, "st_mtim.tv_nsec");

	duk_push_number(ctx, statbuf->st_ctim.tv_nsec);
	duk_put_prop_string(ctx, -2, "st_ctim.tv_nsec");
 
 
	/* Return */ 
	duk_push_object(ctx);

	duk_push_number(ctx, ret);
	duk_put_prop_string(ctx, -2, "value");

	duk_pull(ctx, -2);
	duk_put_prop_string(ctx, -2, "statbuf");

	return 1; 
} 
 
duk_ret_t _joshi_spec_unlink(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* pathname = (char*)duk_get_string(ctx, 0); 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = unlink( 
		pathname 
	); 
 
	/* Error check */ 
	if (ret == -1) { 
		return duk_throw_errno(ctx); 
	} 
 
	/* Return */ 
	duk_push_number(ctx, ret);

	return 1; 
} 
 
duk_ret_t _joshi_spec_unsetenv(duk_context* ctx) { 
	/* Input arguments retrieval */ 
	char* name = (char*)duk_get_string(ctx, 0); 
 
	/* Syscall invocation */ 
	errno = 0; 
	int ret = unsetenv( 
		name 
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
	errno = 0; 
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
	errno = 0; 
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
	{ name: "closedir", func: _joshi_spec_closedir, argc: 1 }, 
	{ name: "dup", func: _joshi_spec_dup, argc: 1 }, 
	{ name: "dup2", func: _joshi_spec_dup2, argc: 2 }, 
	{ name: "execv", func: _joshi_spec_execv, argc: 2 }, 
	{ name: "execvp", func: _joshi_spec_execvp, argc: 2 }, 
	{ name: "exit", func: _joshi_spec_exit, argc: 1 }, 
	{ name: "fork", func: _joshi_spec_fork, argc: 0 }, 
	{ name: "getegid", func: _joshi_spec_getegid, argc: 0 }, 
	{ name: "getenv", func: _joshi_spec_getenv, argc: 1 }, 
	{ name: "geteuid", func: _joshi_spec_geteuid, argc: 0 }, 
	{ name: "getgid", func: _joshi_spec_getgid, argc: 0 }, 
	{ name: "getpid", func: _joshi_spec_getpid, argc: 0 }, 
	{ name: "getrandom", func: _joshi_spec_getrandom, argc: 3 }, 
	{ name: "getuid", func: _joshi_spec_getuid, argc: 0 }, 
	{ name: "lseek", func: _joshi_spec_lseek, argc: 3 }, 
	{ name: "open", func: _joshi_spec_open, argc: 3 }, 
	{ name: "opendir", func: _joshi_spec_opendir, argc: 1 }, 
	{ name: "pipe", func: _joshi_spec_pipe, argc: 1 }, 
	{ name: "poll", func: _joshi_spec_poll, argc: 3 }, 
	{ name: "read", func: _joshi_spec_read, argc: 3 }, 
	{ name: "readdir", func: _joshi_spec_readdir, argc: 1 }, 
	{ name: "setenv", func: _joshi_spec_setenv, argc: 3 }, 
	{ name: "setsid", func: _joshi_spec_setsid, argc: 0 }, 
	{ name: "sleep", func: _joshi_spec_sleep, argc: 1 }, 
	{ name: "stat", func: _joshi_spec_stat, argc: 2 }, 
	{ name: "unlink", func: _joshi_spec_unlink, argc: 1 }, 
	{ name: "unsetenv", func: _joshi_spec_unsetenv, argc: 1 }, 
	{ name: "waitpid", func: _joshi_spec_waitpid, argc: 3 }, 
	{ name: "write", func: _joshi_spec_write, argc: 3 }, 
}; 
 
size_t joshi_spec_builtins_count = 31 ; 
