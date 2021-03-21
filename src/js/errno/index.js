/**
 * Errors thrown when libc returns a non zero errno.
 *
 * @typedef {Error} SysError
 * @property {number} errno A valid errno error code
 * @property {string} message Error description
 * @property {string} stack A human readable string with meesage and stack trace
 */

/** 
 * @exports errno
 * @readonly
 * @enum {number}
 */
const errno	= {
	/** Operation not permitted */
	EPERM: 1,
	/** No such file or directory */
	ENOENT: 2,
	/** No such process */
	ESRCH: 3,	
	/** Interrupted system call */
	EINTR: 4,	
	/** I/O error */
	EIO: 5,
	/** No such device or address */
	ENXIO: 6,
	/** Argument list too long */
	E2BIG: 7,
	/** Exec format error */
	ENOEXEC: 8,
	/** Bad file number */
	EBADF: 9,
	/** No child processes */
	ECHILD: 10,
	/** Try again */
	EAGAIN: 11,
	/** Out of memory */
	ENOMEM: 12,
	/** Permission denied */
	EACCES: 13,
	/** Bad address */
	EFAULT: 14,
	/** Block device required */
	ENOTBLK: 15,
	/** Device or resource busy */
	EBUSY: 16,
	/** File exists */
	EEXIST: 17,
	/** Cross-device link */
	EXDEV: 18,
	/** No such device */
	ENODEV: 19,
	/** Not a directory */
	ENOTDIR: 20,
	/** Is a directory */
	EISDIR: 21,
	/** Invalid argument */
	EINVAL: 22,
	/** File table overflow */
	ENFILE: 23,
	/** Too many open files */
	EMFILE: 24,
	/** Not a typewriter */
	ENOTTY: 25,
	/** Text file busy */
	ETXTBSY: 26,
	/** File too large */
	EFBIG: 27,
	/** No space left on device */
	ENOSPC: 28,
	/** Illegal seek */
	ESPIPE: 29,
	/** Read-only file system */
	EROFS: 30,
	/** Too many links */
	EMLINK: 31,
	/** Broken pipe */
	EPIPE: 32,
	/** Math argument out of domain of func */
	EDOM: 33,
	/** Math result not representable */
	ERANGE: 34,
};

const MESSAGE = {
	1: "Operation not permitted",
	2: "No such file or directory",
	3: "No such process",
	4: "Interrupted system call",
	5: "I/O error",
	6: "No such device or address",
	7: "Argument list too long",
	8: "Exec format error",
	9: "Bad file number",
	10: "No child processes",
	11: "Try again",
	12: "Out of memory",
	13: "Permission denied",
	14: "Bad address",
	15: "Block device required",
	16: "Device or resource busy",
	17: "File exists",
	18: "Cross-device link",
	19: "No such device",
	20: "Not a directory",
	21: "Is a directory",
	22: "Invalid argument",
	23: "File table overflow",
	24: "Too many open files",
	25: "Not a typewriter",
	26: "Text file busy",
	27: "File too large",
	28: "No space left on device",
	29: "Illegal seek",
	30: "Read-only file system",
	31: "Too many links",
	32: "Broken pipe",
	33: "Math argument out of domain of func",
	34: "Math result not representable"
};

/**
 * Throw a {@link module:errno.SysError} error with a given errno value.
 *
 * @param {number} code A valid errno value
 *
 * @returns
 * This function never returns, always throws.
 *
 * @throws {SysError}
 */
errno.fail = function(value) {
	const msg = MESSAGE[value] || '(no description)';

	throw Object.assign(
		new Error(msg + ' (errno = ' + value + ')'), {
			errno: value
		}
	);
}

return errno;
