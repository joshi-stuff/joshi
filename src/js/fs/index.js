const errno = require('errno');
const proc = require('proc');

const fs = {};

const println = require('term').println2;

fs.is_executable = function(pathname) {
	try {
		const stat = fs.stat(pathname);

		if (stat.mode & 0005) {
			return true;
		}

		if((stat.mode & 0050) && (proc.getegid() === stat.gid)) {
			return true;
		}

		if((stat.mode & 0500) && (proc.geteuid() === stat.uid)) {
			return true;
		}

	} catch(err) {
		if ([undefined, 
				errno.EFAULT, 
				errno.ENAMETOOLONG, 
				errno.ENOMEM, 
				errno.EOVERFLOW, 
				errno.EBADFD, 
				errno.EINVAL
			].indexOf(err.errno) !== -1) {

			throw err;
		} else {
			// ignore
		}
	}

	return false;
}

fs.stat = function(pathname) {
	const statbuf = j.stat(pathname).statbuf;

	return {
		gid: statbuf.st_gid,
		mode: statbuf.st_mode,
		size: statbuf.st_size,
		time: {
			access: statbuf['st_atim.tv_nsec'],
			creation: statbuf['st_ctim.tv_nsec'],
			modification: statbuf['st_mtim.tv_nsec'],
		},
		uid: statbuf.st_uid,
	};
}











return fs;
