const errno = require('errno');
const io = require('io');
const math = require('math');
const proc = require('proc');

const fs = {};

const println = require('term').println2;

fs.basename = function(path) {
	return path.substring(1 + path.lastIndexOf('/'));
}

fs.copy_file = function(from, to, mode) {
	var fdFrom;
	var fdTo;

	try {
		fdFrom = io.open(from);
		fdTo = io.truncate(to, mode);

		const buf = new Uint8Array(1024);

		var count;
		while ((count = io.read(fdFrom, buf, buf.length)) !== 0) {
			io.write(fdTo, buf, count);
		}

		io.close(fdFrom);
		io.close(fdTo);
	}
	catch(err) {
		fs.safe_unlink(to);
		throw err;
	}
	finally {
		io.safe_close(fdFrom);
		io.safe_close(fdTo);
	}
}

fs.dirname = function(path) {
	const i = path.lastIndexOf('/');

	if (i === -1) {
		return '.';
	}
	else {
		return path.substring(0, i);
	}
}

fs.exists = function(pathname) {
	try {
		fs.stat(pathname);

		return true;
	} 
	catch(err) {
		if (err.errno === errno.ENOENT) {
			return false;
		}

		throw err;
	}
}

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

	var dirp;

	try {
		dirp = j.opendir(name);
		
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
		if (err.errno !== 0) {
			err.message += ' (' + name + ')';
			throw err;
		}
	}
	finally {
		if (dirp) {
			j.closedir(dirp);
		}
	}

	return items.sort();
}

fs.mkdir = function(pathname, mode) {
	mode = mode || 0755;

	try {
		return j.mkdir(pathname, mode);
	} 
	catch(err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
}

fs.mkdirp = function(pathname, mode) {
	var dirname = '';
	var initialIndex = 1;

	if (!pathname.startsWith('/')) {
		dirname = '.';
		initialIndex = 0;
	}
	
	const parts = pathname.split('/');

	for (var i = initialIndex; i < parts.length; i++) {
		dirname += '/' + parts[i];

		if (!fs.exists(dirname)) {
			fs.mkdir(dirname, mode);
		}
	}	

	return 0;
}

fs.mktemp_file = function(contents, mode) {
	contents = contents || '';
	mode = mode || 0600;

	const rnd = math.get_random_bytes(2);
	const filename = 
		'/tmp/joshi_' + proc.getpid().toString(16) + '_' + rnd[0].toString(16) + 
			rnd[1].toString(16);

	fs.write_file(filename, contents, mode);

	return filename;
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

// TODO: rmdir

fs.safe_unlink = function(path) {
	try {
		fs.unlink(path);
	}
	catch(err) {
		// ignore
	}
}

fs.stat = function(pathname) {
	const statbuf = j.stat(pathname).statbuf;

	return {
		gid: statbuf.st_gid,
		mode: statbuf.st_mode,
		size: statbuf.st_size,
		time: {
			access: statbuf.st_atim.tv_sec,
			creation: statbuf.st_ctim.tv_sec,
			modification: statbuf.st_mtim.tv_sec,
		},
		uid: statbuf.st_uid,
	};
}

fs.unlink = function(pathname) {
	return j.unlink(pathname);
}

fs.write_file = function(path, contents, mode) {
	const fd = io.truncate(path, mode);

	try {
		return io.write_str(fd, contents);
	} 
	finally {
		io.close(fd);
	}
}

return fs;
