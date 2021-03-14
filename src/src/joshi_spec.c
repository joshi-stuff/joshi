#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/random.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include "joshi_core.h"
#include "joshi_spec.h"

typedef struct duk_blk {
	duk_size_t size;
	char data[];
} duk_blk;

#define duk_get_blkcnt_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_blkcnt_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_blksize_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_blksize_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_char_arr(ctx,idx,out_value) cnv_cesu_to_utf(require_string((ctx),(idx)),(out_value))
#define duk_push_char_arr(ctx,value) duk_push_string((ctx),(value))
static char* duk_get_char_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_char_pt(ctx,value) duk_push_string((ctx),(value))
static const char* duk_get_const_char_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_const_char_pt(ctx,value) duk_push_string((ctx),(value))
#define duk_get_dev_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_dev_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_gid_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_gid_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_mode_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_mode_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_nfds_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_nfds_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_nlink_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_nlink_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_ino_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_ino_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_long(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_long(ctx,value) duk_push_int((ctx),(value))
#define duk_get_off_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_off_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_pid_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_pid_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_size_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_size_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_ssize_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_ssize_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_short_int(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_short_int(ctx,value) duk_push_int((ctx),(value))
#define duk_get_uid_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_uid_t(ctx,value) duk_push_int((ctx),(value))
#define duk_get_unsigned(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_unsigned(ctx,value) duk_push_int((ctx),(value))
#define duk_get_unsigned_char(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_unsigned_char(ctx,value) duk_push_int((ctx),(value))
#define duk_get_unsigned_int(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_unsigned_int(ctx,value) duk_push_int((ctx),(value))
static DIR* duk_get_DIR_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_DIR_pt(ctx,value) memcpy(duk_push_fixed_buffer(ctx,sizeof(DIR*)),&(value),sizeof(DIR*))
#define duk_get_void_pt(ctx,idx) ((void*)duk_require_buffer_data((ctx),(idx),NULL))
/* duk_push_void_pt: buffer types do not need/have push support */
static duk_blk* duk_get_char_pt_arr(duk_context* ctx, duk_idx_t idx);
static void duk_push_char_pt_arr(duk_context* ctx, duk_blk* blk);
static duk_blk* duk_get_int_arr(duk_context* ctx, duk_idx_t idx);
static void duk_push_int_arr(duk_context* ctx, duk_blk* blk);
static duk_blk* duk_get_struct_pollfd_arr(duk_context* ctx, duk_idx_t idx);
static void duk_push_struct_pollfd_arr(duk_context* ctx, duk_blk* blk);
static void duk_get_struct_dirent(duk_context* ctx, duk_idx_t idx, struct dirent* value);
static void duk_push_struct_dirent(duk_context* ctx, struct dirent* value);
static void duk_get_struct_stat(duk_context* ctx, duk_idx_t idx, struct stat* value);
static void duk_push_struct_stat(duk_context* ctx, struct stat* value);
static void duk_get_struct_pollfd(duk_context* ctx, duk_idx_t idx, struct pollfd* value);
static void duk_push_struct_pollfd(duk_context* ctx, struct pollfd* value);
static void duk_get_struct_timespec(duk_context* ctx, duk_idx_t idx, struct timespec* value);
static void duk_push_struct_timespec(duk_context* ctx, struct timespec* value);

static duk_blk* duk_malloc(duk_context* ctx, duk_size_t size) {
	duk_push_heap_stash(ctx);
	duk_get_prop_string(ctx, -1, "_malloc_area");

	if (duk_is_undefined(ctx, -1)) {
		duk_pop(ctx);
		duk_push_array(ctx);
		duk_put_prop_string(ctx, -2, "_malloc_area");
		duk_get_prop_string(ctx, -1, "_malloc_area");
	}

	duk_blk* ret_value = 
		duk_push_fixed_buffer(ctx, sizeof(duk_size_t) + size);
	ret_value->size = size;
	duk_put_prop_index(ctx, -2, duk_get_length(ctx, -2));
	duk_pop_2(ctx);

	return ret_value;
}

static void duk_free_all(duk_context* ctx) {
	duk_push_heap_stash(ctx);
	duk_del_prop_string(ctx, -1, "_malloc_area");
	duk_pop(ctx);
}

static char* duk_get_char_pt(duk_context* ctx, duk_idx_t idx) {
	if (duk_is_null(ctx, idx) || duk_is_undefined(ctx, idx)) {
		return NULL;
	}

	const char* cesu = duk_require_string(ctx, idx);
	duk_blk* blk = duk_malloc(ctx, cnv_cesu_to_utf_length(cesu) + 1);
	char* utf = (char*)blk->data;

	cnv_cesu_to_utf(cesu, utf);

	return utf;
}

static const char* duk_get_const_char_pt(duk_context* ctx, duk_idx_t idx) {
	if (duk_is_null(ctx, idx) || duk_is_undefined(ctx, idx)) {
		return NULL;
	}

	const char* cesu = duk_require_string(ctx, idx);
	duk_blk* blk = duk_malloc(ctx, cnv_cesu_to_utf_length(cesu) + 1);
	char* utf = (char*)blk->data;

	cnv_cesu_to_utf(cesu, utf);

	return utf;
}

static DIR* duk_get_DIR_pt(duk_context* ctx, duk_idx_t idx) {
	DIR* value;
	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof(DIR*));
	return value;
}

static duk_blk* duk_get_char_pt_arr(duk_context* ctx, duk_idx_t idx) {
	duk_size_t length = duk_get_length(ctx, idx);
	duk_blk* blk = duk_malloc(ctx, length*sizeof(char*));
	char** value = (char**)blk->data;
	
	for (duk_idx_t i = 0; i < length; i++) {
		duk_get_prop_index(ctx, idx, i);
		value[i] = duk_get_char_pt(ctx, -1);
		duk_pop(ctx);
	}
	
	return blk;
}

static void duk_push_char_pt_arr(duk_context* ctx, duk_blk* blk) {
	duk_size_t length = blk->size / sizeof(char*);
	char** value = (char**)blk->data;
	
	duk_push_array(ctx);
	for (duk_idx_t i = 0; i < length; i++) {
		duk_push_char_pt(ctx, value[i]);
		duk_put_prop_index(ctx, -2, i);
	}
}

static duk_blk* duk_get_int_arr(duk_context* ctx, duk_idx_t idx) {
	duk_size_t length = duk_get_length(ctx, idx);
	duk_blk* blk = duk_malloc(ctx, length*sizeof(int));
	int* value = (int*)blk->data;
	
	for (duk_idx_t i = 0; i < length; i++) {
		duk_get_prop_index(ctx, idx, i);
		value[i] = duk_get_int(ctx, -1);
		duk_pop(ctx);
	}
	
	return blk;
}

static void duk_push_int_arr(duk_context* ctx, duk_blk* blk) {
	duk_size_t length = blk->size / sizeof(int);
	int* value = (int*)blk->data;
	
	duk_push_array(ctx);
	for (duk_idx_t i = 0; i < length; i++) {
		duk_push_int(ctx, value[i]);
		duk_put_prop_index(ctx, -2, i);
	}
}

static duk_blk* duk_get_struct_pollfd_arr(duk_context* ctx, duk_idx_t idx) {
	duk_size_t length = duk_get_length(ctx, idx);
	duk_blk* blk = duk_malloc(ctx, length*sizeof(struct pollfd));
	struct pollfd* value = (struct pollfd*)blk->data;
	
	for (duk_idx_t i = 0; i < length; i++) {
		duk_get_prop_index(ctx, idx, i);
		duk_get_struct_pollfd(ctx, -1, &(value[i]));
		duk_pop(ctx);
	}
	
	return blk;
}

static void duk_push_struct_pollfd_arr(duk_context* ctx, duk_blk* blk) {
	duk_size_t length = blk->size / sizeof(struct pollfd);
	struct pollfd* value = (struct pollfd*)blk->data;
	
	duk_push_array(ctx);
	for (duk_idx_t i = 0; i < length; i++) {
		duk_push_struct_pollfd(ctx, &(value[i]));
		duk_put_prop_index(ctx, -2, i);
	}
}

static void duk_get_struct_dirent(duk_context* ctx, duk_idx_t idx, struct dirent* value) {
	duk_get_prop_string(ctx, idx, "d_ino");
	value->d_ino = duk_get_ino_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "d_off");
	value->d_off = duk_get_off_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "d_reclen");
	value->d_reclen = duk_get_unsigned_int(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "d_type");
	value->d_type = duk_get_unsigned_char(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "d_name");
	cnv_cesu_to_utf(duk_get_string(ctx, -1), value->d_name);
	duk_pop(ctx);
}

static void duk_push_struct_dirent(duk_context* ctx, struct dirent* value) {
	duk_push_object(ctx);
	duk_push_ino_t(ctx, value->d_ino);
	duk_put_prop_string(ctx, -2, "d_ino");
	duk_push_off_t(ctx, value->d_off);
	duk_put_prop_string(ctx, -2, "d_off");
	duk_push_unsigned_int(ctx, value->d_reclen);
	duk_put_prop_string(ctx, -2, "d_reclen");
	duk_push_unsigned_char(ctx, value->d_type);
	duk_put_prop_string(ctx, -2, "d_type");
	duk_push_string(ctx, value->d_name);
	duk_put_prop_string(ctx, -2, "d_name");
}

static void duk_get_struct_stat(duk_context* ctx, duk_idx_t idx, struct stat* value) {
	duk_get_prop_string(ctx, idx, "st_dev");
	value->st_dev = duk_get_dev_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_ino");
	value->st_ino = duk_get_ino_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_mode");
	value->st_mode = duk_get_mode_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_nlink");
	value->st_nlink = duk_get_nlink_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_uid");
	value->st_uid = duk_get_uid_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_gid");
	value->st_gid = duk_get_gid_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_rdev");
	value->st_rdev = duk_get_dev_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_size");
	value->st_size = duk_get_off_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_blksize");
	value->st_blksize = duk_get_blksize_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_blocks");
	value->st_blocks = duk_get_blkcnt_t(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_atim");
	duk_get_struct_timespec(ctx, -1, &(value->st_atim));
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_mtim");
	duk_get_struct_timespec(ctx, -1, &(value->st_mtim));
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "st_ctim");
	duk_get_struct_timespec(ctx, -1, &(value->st_ctim));
	duk_pop(ctx);
}

static void duk_push_struct_stat(duk_context* ctx, struct stat* value) {
	duk_push_object(ctx);
	duk_push_dev_t(ctx, value->st_dev);
	duk_put_prop_string(ctx, -2, "st_dev");
	duk_push_ino_t(ctx, value->st_ino);
	duk_put_prop_string(ctx, -2, "st_ino");
	duk_push_mode_t(ctx, value->st_mode);
	duk_put_prop_string(ctx, -2, "st_mode");
	duk_push_nlink_t(ctx, value->st_nlink);
	duk_put_prop_string(ctx, -2, "st_nlink");
	duk_push_uid_t(ctx, value->st_uid);
	duk_put_prop_string(ctx, -2, "st_uid");
	duk_push_gid_t(ctx, value->st_gid);
	duk_put_prop_string(ctx, -2, "st_gid");
	duk_push_dev_t(ctx, value->st_rdev);
	duk_put_prop_string(ctx, -2, "st_rdev");
	duk_push_off_t(ctx, value->st_size);
	duk_put_prop_string(ctx, -2, "st_size");
	duk_push_blksize_t(ctx, value->st_blksize);
	duk_put_prop_string(ctx, -2, "st_blksize");
	duk_push_blkcnt_t(ctx, value->st_blocks);
	duk_put_prop_string(ctx, -2, "st_blocks");
	duk_push_struct_timespec(ctx, &(value->st_atim));
	duk_put_prop_string(ctx, -2, "st_atim");
	duk_push_struct_timespec(ctx, &(value->st_mtim));
	duk_put_prop_string(ctx, -2, "st_mtim");
	duk_push_struct_timespec(ctx, &(value->st_ctim));
	duk_put_prop_string(ctx, -2, "st_ctim");
}

static void duk_get_struct_pollfd(duk_context* ctx, duk_idx_t idx, struct pollfd* value) {
	duk_get_prop_string(ctx, idx, "fd");
	value->fd = duk_get_int(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "events");
	value->events = duk_get_short_int(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "revents");
	value->revents = duk_get_short_int(ctx, -1);
	duk_pop(ctx);
}

static void duk_push_struct_pollfd(duk_context* ctx, struct pollfd* value) {
	duk_push_object(ctx);
	duk_push_int(ctx, value->fd);
	duk_put_prop_string(ctx, -2, "fd");
	duk_push_short_int(ctx, value->events);
	duk_put_prop_string(ctx, -2, "events");
	duk_push_short_int(ctx, value->revents);
	duk_put_prop_string(ctx, -2, "revents");
}

static void duk_get_struct_timespec(duk_context* ctx, duk_idx_t idx, struct timespec* value) {
	duk_get_prop_string(ctx, idx, "tv_nsec");
	value->tv_nsec = duk_get_long(ctx, -1);
	duk_pop(ctx);
	duk_get_prop_string(ctx, idx, "tv_sec");
	value->tv_sec = duk_get_long(ctx, -1);
	duk_pop(ctx);
}

static void duk_push_struct_timespec(duk_context* ctx, struct timespec* value) {
	duk_push_object(ctx);
	duk_push_long(ctx, value->tv_nsec);
	duk_put_prop_string(ctx, -2, "tv_nsec");
	duk_push_long(ctx, value->tv_sec);
	duk_put_prop_string(ctx, -2, "tv_sec");
}

static duk_ret_t _joshi_spec_alarm(duk_context* ctx) {
	int seconds;

	seconds = duk_get_int(ctx, 0);

	errno = 0;
	unsigned ret_value;
	ret_value = 

	alarm(seconds);


	duk_push_unsigned(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_chdir(duk_context* ctx) {
	char* path;

	path = duk_get_char_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	chdir(path);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_close(duk_context* ctx) {
	int fd;

	fd = duk_get_int(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	close(fd);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_closedir(duk_context* ctx) {
	DIR* dirp;

	dirp = duk_get_DIR_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	closedir(dirp);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_dup(duk_context* ctx) {
	int fildes;

	fildes = duk_get_int(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	dup(fildes);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_dup2(duk_context* ctx) {
	int fildes;
	int fildes2;

	fildes = duk_get_int(ctx, 0);
	fildes2 = duk_get_int(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	dup2(fildes,fildes2);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_execv(duk_context* ctx) {
	char* pathname;
	duk_blk* argv;

	pathname = duk_get_char_pt(ctx, 0);
	argv = duk_get_char_pt_arr(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	execv(pathname,((char**)argv->data));

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_execvp(duk_context* ctx) {
	char* file;
	duk_blk* argv;

	file = duk_get_char_pt(ctx, 0);
	argv = duk_get_char_pt_arr(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	execvp(file,((char**)argv->data));

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_exit(duk_context* ctx) {
	int status;

	status = duk_get_int(ctx, 0);

	errno = 0;

	exit(status);



	duk_free_all(ctx);
	return 0;
}

static duk_ret_t _joshi_spec_fork(duk_context* ctx) {


	errno = 0;
	pid_t ret_value;
	ret_value = 

	fork();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_pid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getegid(duk_context* ctx) {


	errno = 0;
	uid_t ret_value;
	ret_value = 

	getegid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_uid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getenv(duk_context* ctx) {
	char* name;

	name = duk_get_char_pt(ctx, 0);

	errno = 0;
	char* ret_value;
	ret_value = 

	getenv(name);


	duk_push_char_pt(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_geteuid(duk_context* ctx) {


	errno = 0;
	uid_t ret_value;
	ret_value = 

	geteuid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_uid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getgid(duk_context* ctx) {


	errno = 0;
	uid_t ret_value;
	ret_value = 

	getgid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_uid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getpid(duk_context* ctx) {


	errno = 0;
	pid_t ret_value;
	ret_value = 

	getpid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_pid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getrandom(duk_context* ctx) {
	void* buf;
	size_t buflen;
	unsigned int flags;

	buf = duk_get_void_pt(ctx, 0);
	buflen = duk_get_size_t(ctx, 1);
	flags = duk_get_unsigned_int(ctx, 2);

	errno = 0;
	ssize_t ret_value;
	ret_value = 

	getrandom(buf,buflen,flags);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_ssize_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_getuid(duk_context* ctx) {


	errno = 0;
	uid_t ret_value;
	ret_value = 

	getuid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_uid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_kill(duk_context* ctx) {
	pid_t pid;
	int sig;

	pid = duk_get_pid_t(ctx, 0);
	sig = duk_get_int(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	kill(pid,sig);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_lseek(duk_context* ctx) {
	int fildes;
	off_t offset;
	int whence;

	fildes = duk_get_int(ctx, 0);
	offset = duk_get_off_t(ctx, 1);
	whence = duk_get_int(ctx, 2);

	errno = 0;
	off_t ret_value;
	ret_value = 

	lseek(fildes,offset,whence);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_off_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_mkdir(duk_context* ctx) {
	char* pathname;
	mode_t mode;

	pathname = duk_get_char_pt(ctx, 0);
	mode = duk_get_mode_t(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	mkdir(pathname,mode);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_open(duk_context* ctx) {
	char* pathname;
	int flags;
	mode_t mode;

	pathname = duk_get_char_pt(ctx, 0);
	flags = duk_get_int(ctx, 1);
	mode = duk_get_mode_t(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	open(pathname,flags,mode);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_opendir(duk_context* ctx) {
	char* name;

	name = duk_get_char_pt(ctx, 0);

	errno = 0;
	DIR* ret_value;
	ret_value = 

	opendir(name);

	if (ret_value == NULL) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_DIR_pt(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_pipe(duk_context* ctx) {
	duk_blk* fildes;

	fildes = duk_get_int_arr(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	pipe(((int*)fildes->data));

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_object(ctx);
	duk_push_int_arr(ctx, fildes);
	duk_put_prop_string(ctx, -2, "fildes");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_poll(duk_context* ctx) {
	duk_blk* fds;
	nfds_t nfds;
	int timeout;

	fds = duk_get_struct_pollfd_arr(ctx, 0);
	nfds = duk_get_nfds_t(ctx, 1);
	timeout = duk_get_int(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	poll(((struct pollfd*)fds->data),nfds,timeout);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_object(ctx);
	duk_push_struct_pollfd_arr(ctx, fds);
	duk_put_prop_string(ctx, -2, "fds");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_read(duk_context* ctx) {
	int fd;
	void* buf;
	size_t count;

	fd = duk_get_int(ctx, 0);
	buf = duk_get_void_pt(ctx, 1);
	count = duk_get_size_t(ctx, 2);

	errno = 0;
	ssize_t ret_value;
	ret_value = 

	read(fd,buf,count);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_ssize_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_readdir(duk_context* ctx) {
	DIR* dirp;

	dirp = duk_get_DIR_pt(ctx, 0);

	errno = 0;
	struct dirent* ret_value;
	ret_value = 

	readdir(dirp);

	if (ret_value == NULL) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_struct_dirent(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_setenv(duk_context* ctx) {
	char* name;
	char* value;
	int overwrite;

	name = duk_get_char_pt(ctx, 0);
	value = duk_get_char_pt(ctx, 1);
	overwrite = duk_get_int(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	setenv(name,value,overwrite);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_setsid(duk_context* ctx) {


	errno = 0;
	pid_t ret_value;
	ret_value = 

	setsid();

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_pid_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_sleep(duk_context* ctx) {
	unsigned int seconds;

	seconds = duk_get_unsigned_int(ctx, 0);

	errno = 0;
	unsigned int ret_value;
	ret_value = 

	sleep(seconds);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_unsigned_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_stat(duk_context* ctx) {
	char* pathname;
	struct stat statbuf;

	pathname = duk_get_char_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	stat(pathname,&(statbuf));

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_object(ctx);
	duk_push_struct_stat(ctx, &(statbuf));
	duk_put_prop_string(ctx, -2, "statbuf");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_unlink(duk_context* ctx) {
	char* pathname;

	pathname = duk_get_char_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	unlink(pathname);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_unsetenv(duk_context* ctx) {
	char* name;

	name = duk_get_char_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	unsetenv(name);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_int(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_waitpid(duk_context* ctx) {
	pid_t pid;
	int wstatus;
	int options;

	pid = duk_get_pid_t(ctx, 0);
	options = duk_get_int(ctx, 1);

	errno = 0;
	pid_t ret_value;
	ret_value = 

	waitpid(pid,&(wstatus),options);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_object(ctx);
	duk_push_int(ctx, wstatus);
	duk_put_prop_string(ctx, -2, "wstatus");
	duk_push_pid_t(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	duk_free_all(ctx);
	return 1;
}

static duk_ret_t _joshi_spec_write(duk_context* ctx) {
	int fd;
	void* buf;
	size_t count;

	fd = duk_get_int(ctx, 0);
	buf = duk_get_void_pt(ctx, 1);
	count = duk_get_size_t(ctx, 2);

	errno = 0;
	ssize_t ret_value;
	ret_value = 

	write(fd,buf,count);

	if (ret_value == -1) {
		duk_free_all(ctx);
		duk_throw_errno(ctx);
	}

	duk_push_ssize_t(ctx, ret_value);

	duk_free_all(ctx);
	return 1;
}


BUILTIN joshi_spec_builtins[] = {
	{ name: "alarm", func: _joshi_spec_alarm, argc: 1 },
	{ name: "chdir", func: _joshi_spec_chdir, argc: 1 },
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
	{ name: "kill", func: _joshi_spec_kill, argc: 2 },
	{ name: "lseek", func: _joshi_spec_lseek, argc: 3 },
	{ name: "mkdir", func: _joshi_spec_mkdir, argc: 2 },
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

size_t joshi_spec_builtins_count = 34;