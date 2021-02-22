const errno = require('errno');
const io = require('io');
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

fs.list_dir = function(name) {
	const items = [];

	const dirp = j.opendir(name);

	try {
		while(true) {
			const dirent = j.readdir(dirp);
			const name = dirent.d_name;

			if (name === '.' || name === '..') {
				continue;
			}
			
			items.push(dirent.d_name);
		}
	}
	catch(err) {
		if (err.errno) {
			throw err;
		}
	}
	finally {
		j.closedir(dirp);
	}

	return items.sort();
}

fs.read_file = function(path) {
	const fd = io.open(path);

	try {
		return io.read_file(fd);
	} 
	finally {
		io.close(fd);
	}
}

fs.realpath = function(path) {
	return j.realpath(path);
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

fs.unlink = function(pathname) {
	return j.unlink(pathname);
}

return fs;
