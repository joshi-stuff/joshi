const fs = require('fs');
const io = require('io');
const kern = require('kern');
const math = require('math');
const proc = require('proc');
const $ = require('shell');
const stream = require('stream');
const term = require('term');
const print = require('term').print;
const print2 = require('term').print2;
const println = require('term').println;
const println2 = require('term').println2;

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

term.clear();

require('./proc.js');

// Test kern
test('kern.search_path+require.resolve', function() {
	try {
		const cwd = fs.realpath('.');

		kern.search_path = [fs.dirname(cwd)];

		const path = require.resolve('src/tests.js');

		expect.is(cwd + '/tests.js', path);
	} finally {
		kern.search_path = [];
	}
});

test('require.owner_path', function() {
	expect.is(fs.realpath('./tests.js'), require.owner_path);
});

// Test fs
test('[rm|mk]dir+stat', function() {
	const DIR = '/tmp/mkdir.'+proc.getpid();

	fs.mkdir(DIR);
	const st = fs.stat(DIR);

	log('st', '=', st);

	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
	expect.is(0755, (st.mode & 0777));
});

test('mkdirp+stat', function() {
	const DIR = '/tmp/tests/perico/juan';

	fs.mkdirp(DIR);
	const st = fs.stat(DIR);

	log('st', '=', st);

	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
	expect.is(0755, (st.mode & 0777));
});

test('basename+dirname', function() {
	const DIR = '/tmp/tests/lili';
	const FILE = 'lolo';
	const PATH = DIR + '/' + FILE;

	expect.is(FILE, fs.basename(PATH));
	expect.is(DIR, fs.dirname(PATH));
});

test('[write/copy/read]_file', function() {
	const DIR = '/tmp/tests/copy';
	const SRC = '/file.src';
	const DST = '/file.dst';
	const CONTENT = 'holi';

	fs.mkdirp(DIR);

	fs.write_file(DIR+SRC, CONTENT, 0600);
	fs.copy_file(DIR+SRC, DIR+DST, 0644);

	const st1 = fs.stat(DIR+SRC);
	log('st(src)', st1);
	expect.is(proc.getuid(), st1.uid);
	expect.is(proc.getgid(), st1.gid);
	expect.is(0600, (st1.mode & 0777));

	const st2 = fs.stat(DIR+DST);
	log('st(dst)', st2);
	expect.is(proc.getuid(), st2.uid);
	expect.is(proc.getgid(), st2.gid);
	expect.is(0644, (st2.mode & 0777));

	expect.is(st1.size, st2.size);

	const c1 = fs.read_file(DIR+SRC);
	expect.is(CONTENT, c1);

	const c2 = fs.read_file(DIR+DST);
	expect.is(CONTENT, c2);
});

test('exists+is_executable', function() {
	expect.is(true, fs.exists('/usr/bin/bash'));
	expect.is(true, fs.is_executable('/usr/bin/bash'));
});

test('list_dir', function() {
	const DIR = '/tmp/tests/list_dir/';
	const FILE1 = 'file1';
	const FILE2 = 'file2';

	fs.mkdirp(DIR);

	fs.write_file(DIR+FILE1, FILE1, 0600);
	fs.write_file(DIR+FILE2, FILE2, 0600);

	const items = fs.list_dir(DIR);

	expect.is(2, items.length);
	expect.is(FILE1, items[0]);
	expect.is(FILE2, items[1]);
});

test('mktemp_file', function() {
	const CONTENT = 'perico';

	const filename = fs.mktemp_file(CONTENT);
	log('filename=', filename);

	expect.is(CONTENT, fs.read_file(filename));
});

test('realpath', function() {
	const saved_path = fs.realpath('.');
	
	proc.chdir('/tmp');
	const path = fs.realpath('.');
	proc.chdir(saved_path);

	expect.is('/tmp', path);

	expect.throws(function() {
		fs.realpath('/tmp/nonsense/inexistent/path')
	});
});

test('unlink+safe_unlink', function() {
	const FILE = '/tmp/test_unlink';

	fs.write_file(FILE, 'holi');
	expect.is(true, fs.exists(FILE));
	fs.unlink(FILE);
	expect.is(false, fs.exists(FILE));

	expect.throws(function() {
		fs.unlink(FILE);
	});

	expect.not_throws(function() {
		fs.safe_unlink(FILE);
	});
});

test('write_file', function() {
	const FILE = '/tmp/test_write_file';

	fs.write_file(FILE, 'holi');
	expect.is('holi', fs.read_file(FILE));
});

// Test io
test('append+write_line+close', function() {
	const FILE = '/tmp/test_append';

	fs.safe_unlink(FILE);
	const fd = io.append(FILE, 0600);
	io.write_line(fd, 'line 1');
	io.lseek(fd, 0, io.SEEK_SET);
	io.write_line(fd, 'line 2');
	io.close(fd);

	expect.is('line 1\nline 2\n', fs.read_file(FILE));
});

test('create', function() {
	const FILE = '/tmp/test_create';

	fs.safe_unlink(FILE);
	const fd = io.create(FILE, 0600);
	io.write_line(fd, 'line 1');
	io.lseek(fd, 0, io.SEEK_SET);
	io.write_line(fd, 'line 2');
	io.close(fd);

	expect.is('line 2\n', fs.read_file(FILE));
});

test('open+read_file', function() {
	const FILE = '/tmp/test_open';
	const CONTENT = 'holi';

	fs.write_file(FILE, CONTENT);
	const fd = io.open(FILE);
	const content = io.read_file(fd)
	io.close(fd);

	expect.is(CONTENT, content);
});

test('dup', function() {
	const FILE = '/tmp/test_dup';
	const CONTENT = 'holi';

	fs.write_file(FILE, CONTENT);
	const fd1 = io.open(FILE);
	const fd2 = io.dup(fd1);
	const content = io.read_file(fd2)
	io.close(fd1);
	io.close(fd2);

	expect.is(CONTENT, content);
});

test('dup2', function() {
	const FILE = '/tmp/test_dup2';
	const CONTENT = 'holi';

	fs.write_file(FILE, CONTENT);
	const fd1 = io.open(FILE);
	io.dup2(fd1, 13);
	const content = io.read_file(13)
	io.close(fd1);
	io.close(13);

	expect.is(CONTENT, content);
});

test('pipe+read_line', function() {
	const CONTENT = 'holi';

	const fd = io.pipe();
	io.write_line(fd[1], CONTENT);
	const sd = stream.create(fd[0]);
	const content = stream.read_line(sd);
	io.close(fd[0]);
	io.close(fd[1]);

	expect.is(CONTENT, content);
});

test('poll', function() {
	const CONTENT = 'holi';

	const fd = io.pipe();

	const fds = [{
		fd: fd[0],
		events: io.POLLIN,
		revents: 0
	}];

	expect.is(0, fds[0].revents);

	io.write_line(fd[1], CONTENT);
	io.poll(fds, 0);
	expect.is(io.POLLIN, fds[0].revents);

	io.close(fd[0]);
	io.close(fd[1]);
});

test('read_bytes', function() {
	const FILE = '/tmp/test_read_bytes';
	const CONTENT = 'holi';

	fs.write_file(FILE, CONTENT);
	const fd = io.open(FILE);
	const bytes = io.read_bytes(fd);
	io.close(fd);

	expect.is(4, bytes.length);
	expect.is(104, bytes[0]);
	expect.is(111, bytes[1]);
	expect.is(108, bytes[2]);
	expect.is(105, bytes[3]);
});

test('lseek+tell+write_str', function() {
	const FILE = '/tmp/test_lseek';

	const fd = io.truncate(FILE, 0600);

	io.write_line(fd, 'line 1');
	io.write_str(fd, 'line 2');
	expect.is(13, io.tell(fd));

	io.lseek(fd, 2, io.SEEK_SET);
	expect.is(2, io.tell(fd));

	io.close(fd);
});

// Test math
test('get_random_bytes', function() {
	const bytes = math.get_random_bytes(4);

	expect.is(4, bytes.length);

	var str = '';
	for (var i=0; i<bytes.length; i++) {
		str += bytes[i].toString(16);
	}
	log(str);
});

// Test shell
test('more < FILE', function() {
	const FILE = '/etc/environment';
	const x = {};

	$('more')
		.pipe(0, FILE)
		.pipe(1, x)
		.do();

	expect.is(fs.read_file(FILE), x.out);
});

test('echo perico > FILE', function() {
	const FILE = '/tmp/test_truncate';

	$('echo', 'perico')
		.pipe(1, '0:' + FILE)
		.do();

	expect.is('perico\n', fs.read_file(FILE));
});

test('echo perico >> FILE', function() {
	const FILE = '/tmp/test_append';

	$('echo', 'perico')
		.pipe(1, FILE)
		.do();

	$('echo', 'perico')
		.pipe(1, '+:' + FILE)
		.do();

	expect.is('perico\nperico\n', fs.read_file(FILE));
});

test('echo perico > null', function() {
	$('echo', 'perico')
		.pipe(1, null)
		.do();
	
	log('the string "perico" should NOT appear above this line');
});

test('more < HERE_STRING', function() {
	const x = {};

	$('more')
		.pipe(0, ['perico'])
		.pipe(1, x)
		.do();

	expect.is('perico', x.out);
});