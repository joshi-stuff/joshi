const errno = require('errno');
const fs = require('fs');
const io = require('io');
const proc = require('proc');
const stream = require('stream');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('alarm', function() {
	const fds = io.pipe();

	proc.signal(proc.SIGALRM, function() {
		io.close(fds[1]);
		io.close(fds[0]);
	});

	const sd = stream.create(fds[0]);
	proc.alarm(1);
	expect.throws(function() {
		stream.read_line(sd);
	});

	expect.is(
		7, 
		proc.fork(true, function() {
			proc.signal(proc.SIGALRM, null);
			proc.alarm(1);
			proc.sleep(2);
			proc.exit(7);
		}).exit_status
	);
});

test('atexit', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);

	const rc = proc.fork(true, function() {
		proc.atexit(function() {
			fs.write_file(FILE, 'holi');
		});

		proc.exit(13);
	});

	expect.is(13, rc.exit_status);
	expect.is('holi', fs.read_file(FILE));
});

test('atexit > inherited handlers', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);

	const rc = proc.fork(true, function() {
		proc.atexit(true, function() {
			const fd = io.append(FILE);
			io.write_string(fd, 'holi');	
			io.close(fd);
		});
	
		proc.fork(true, function() {});

		proc.exit(13);
	});

	expect.is(13, rc.exit_status);
	expect.is('holiholi', fs.read_file(FILE));
});

test('atexit > not inherited handlers', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);

	const rc = proc.fork(true, function() {
		proc.atexit(function() {
			const fd = io.append(FILE);
			io.write_string(fd, 'holi');	
			io.close(fd);
		});
	
		proc.fork(true, function() {});

		proc.exit(13);
	});

	expect.is(13, rc.exit_status);
	expect.is('holi', fs.read_file(FILE));
});

test('chdir', function() {
	const cwd = fs.realpath('.');
	proc.chdir('/tmp');
	expect.is('/tmp', fs.realpath('.'));
	proc.chdir(cwd);
	expect.is(cwd, fs.realpath('.'));
});

test('exec > with path search', function() {
	const FILE = '/tmp/joshi';

	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 1);
		proc.exec('echo', ['-n', 'holi']);
	});

	io.close(fd);

	expect.is('holi', fs.read_file(FILE));
});

test('exec > without path search', function() {
	const FILE = '/tmp/joshi';

	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 1);
		proc.exec('/usr/bin/echo', ['-n', 'holi'], {search_path: false});
	});

	io.close(fd);

	expect.is('holi', fs.read_file(FILE));

	expect.throws(function() {
		proc.exec('dummy');
	});
});

test('exec > with dir', function() {
	const FILE = '/tmp/joshi';

	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 1);
		proc.exec('pwd', {dir: '/tmp'});
	});

	io.close(fd);

	expect.is('/tmp\n', fs.read_file(FILE));
});

test('exec > with env', function() {
	const FILE = '/tmp/joshi';

	const fd = io.truncate(FILE);

	proc.fork(true, function() {
		io.dup2(fd, 1);
		proc.exec('env', {env: {HOLI: 'holi'}});
	});

	io.close(fd);

	expect.is(
		true, 
		fs.read_file(FILE)
			.includes('HOLI=holi\n')
	);
});

test('exit', function() {
	const result = proc.fork(true, function() {
		proc.exit(13);
	});

	expect.is(13, result.exit_status);
});

//test('fork', function() {
// 	No need to test it, since it is used in almost every test
//});

test('fork2', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE);

	proc.fork2(function() {
		fs.write_file(FILE, 'holi');
	});

	proc.sleep(1);

	expect.is('holi', fs.read_file(FILE));
});

test('fork2 > with getpid', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE);

	const pid = proc.fork2(true, function() {
		fs.write_file(FILE, proc.getpid());
	});

	try {
		proc.waitpid(pid);
	} 
	catch(err) {
		if (err.errno !== errno.ECHILD) {
			throw err;
		}
	}

	expect.equals(pid, fs.read_file(FILE));
});

test('getegid, getgid', function() {
	const gid = proc.getgid();

	log('gid=', gid);

	expect.is(gid, proc.getegid());
});

test('getenv', function() {
	expect.is(fs.realpath('.'), proc.getenv('PWD'));
});

test('geteuid, getuid', function() {
	const uid = proc.getuid();

	log('uid=', uid);

	expect.is(uid, proc.geteuid());
});

test('getpid', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE);

	const pid = proc.fork(function() {
		fs.write_file(FILE, proc.getpid());
	});

	proc.waitpid(pid);

	expect.equals(pid, fs.read_file(FILE));
});

test('kill, signal', function() {
	var called = false;

	proc.signal(proc.SIGUSR1, function() {
		called = true;
	});

	proc.kill(proc.getpid(), proc.SIGUSR1);

	expect.is(true, called);

	called = false;

	proc.signal(proc.SIGUSR1, null);

	proc.kill(proc.getpid(), proc.SIGUSR1);

	expect.is(false, called);
});

test('setenv', function() {
	proc.setenv('perico', 'holi', true);
	expect.is('holi', proc.getenv('perico'));

	proc.setenv('perico', 'lili', false);
	expect.is('holi', proc.getenv('perico'));

	proc.setenv('perico', null);
	expect.is(null, proc.getenv('perico'));
});

//test('setsid', function() {
// 	No way to test it
//});

test('sleep', function() {
	const before = new Date().getTime()
	proc.sleep(1);
	const diff = new Date().getTime() - before;

	log('diff =', diff);
	expect.is(true, diff>800 && diff<1200);
});

test('unsetenv', function() {
	proc.setenv('perico', 'holi');
	expect.is('holi', proc.getenv('perico'));

	proc.unsetenv('perico');
	expect.is(null, proc.getenv('perico'));
});

test('waitpid', function() {
	const pid = proc.fork(function() {
		proc.exit(13);
	});

	const result = proc.waitpid(pid);

	log('result =', result);

	expect.is(pid, result.value);
	expect.is(13, result.exit_status);
	expect.is(undefined, result.term_signal);
	expect.is(undefined, result.stop_signal);
	expect.is(false, result.core_dump);
	expect.is(false, result.continued);
});

test('waitpid > killed', function() {
	const pid = proc.fork(function() {
		proc.wait(100);
	});

	proc.kill(pid);

	const result = proc.waitpid(pid);

	log('result =', result);

	expect.is(pid, result.value);
	expect.is(undefined, result.exit_status);
	expect.is(proc.SIGKILL, result.term_signal);
	expect.is(undefined, result.stop_signal);
	expect.is(false, result.core_dump);
	expect.is(false, result.continued);
});
