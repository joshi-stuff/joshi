const fs = require('fs');
const proc = require('proc');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('basename', function() {
	expect.is('holi', fs.basename('/usr/share/holi'));
	expect.is('holi', fs.basename('holi'));
});

test('copy_file', function() {
	const SRC = '/tmp/joshi1';
	const DEST = '/tmp/joshi2';
	const CONTENT = 'holi';

	fs.write_file(SRC, CONTENT, 0600);
	
	fs.unlink(DEST, false);
	fs.copy_file(SRC, DEST, 0644);

	var st = fs.stat(DEST);
	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
	expect.is(0644, (st.mode & 0777));

	expect.is(CONTENT, fs.read_file(DEST));

	fs.unlink(DEST, false);
	fs.copy_file(SRC, DEST);

	st = fs.stat(DEST);
	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
	expect.is(0600, (st.mode & 0777));
});

test('create_temp_file', function() {
	const CONTENT = 'holi';

	const filename = fs.create_temp_file(CONTENT);
	log('filename=', filename);

	expect.is(CONTENT, fs.read_file(filename));
});

test('dirname', function() {
	expect.is('/usr/share', fs.dirname('/usr/share/holi'));
	expect.is('.', fs.dirname('holi'));
});

test('exists', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '');

	expect.is(true, fs.exists(FILE));
});

test('is_block_device', function() {
	const items = fs.list_dir('/dev/block');
	var DEV = '/dev/block/' + items[0];
	
	while (fs.is_link(DEV)) {
		DEV = fs.read_link(DEV);
	}

	log('dev =', DEV);

	expect.is(true, fs.is_block_device(DEV));
	expect.is(false, fs.is_block_device('/dev/null'));
	expect.is(false, fs.is_block_device('/dev'));
});

test('is_char_device', function() {
	expect.is(true, fs.is_char_device('/dev/null'));
	expect.is(false, fs.is_char_device('/dev'));
});

test('is_directory', function() {
	expect.is(true, fs.is_directory('/dev'));
	expect.is(false, fs.is_directory('/dev/null'));
});

test('is_executable', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0700);

	expect.is(true, fs.is_executable(FILE));

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0600);

	expect.is(false, fs.is_executable(FILE));
});

test('is_fifo', function() {
	const FIFO = '/tmp/joshi';

	fs.unlink(FIFO, false);
	fs.mkfifo(FIFO);

	expect.is(true, fs.is_fifo(FIFO));
	expect.is(false, fs.is_fifo('/dev'));
	expect.is(false, fs.is_fifo('/dev/null'));
});

test('is_file', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '');

	expect.is(true, fs.is_file(FILE));
	expect.is(false, fs.is_file('/dev'));
	expect.is(false, fs.is_file('/dev/null'));
});

test('is_link', function() {
	const LINK = '/tmp/joshiln';

	fs.unlink(LINK, false);
	proc.fork(true, function() {
		proc.exec('ln', ['-s', '/tmp', LINK]);
	});

	expect.is(true, fs.is_link(LINK));
	expect.is(false, fs.is_link('/'));
});

test('is_readable', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0600);

	expect.is(true, fs.is_readable(FILE));

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0200);

	expect.is(false, fs.is_readable(FILE));
});

//test('is_socket', function() {
//	// There's no easy way to test is_socket
//});

test('is_writable', function() {
	const FILE = '/tmp/joshi';
	const FILE2 = '/tmp/joshi2';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0600);

	expect.is(true, fs.is_writable(FILE));

	fs.unlink(FILE2, false);
	fs.copy_file(FILE, FILE2, 0400);

	expect.is(false, fs.is_writable(FILE2));
});

test('list_dir', function() {
	const DIR = '/tmp/joshidir';
	const FILE1 = 'file1';
	const FILE2 = 'file2';

	fs.rmdir(DIR, true);
	fs.mkdirp(DIR);

	fs.write_file(DIR + '/' + FILE1, FILE1, 0600);
	fs.write_file(DIR + '/' + FILE2, FILE2, 0600);

	const items = fs.list_dir(DIR).sort();

	expect.is(2, items.length);
	expect.is(FILE1, items[0]);
	expect.is(FILE2, items[1]);
});

test('list_dir > with callback', function() {
	const DIR = '/tmp/joshidir';
	const FILE1 = 'file1';
	const FILE2 = 'file2';

	fs.rmdir(DIR, true);
	fs.mkdirp(DIR);

	fs.write_file(DIR + '/' + FILE1, FILE1, 0600);
	fs.write_file(DIR + '/' + FILE2, FILE2, 0600);

	const items = [];
	const indexes = [];

	fs.list_dir(DIR, function(item, i) {
		items.push(item);
		indexes.push(i);
	});

	expect.array_equals([0, 1], indexes);
	expect.array_equals([FILE1, FILE2], items.sort());
});

test('list_dir > with callback, cancelling', function() {
	const DIR = '/tmp/joshidir';
	const FILE1 = 'file1';
	const FILE2 = 'file2';

	fs.rmdir(DIR, true);
	fs.mkdirp(DIR);

	fs.write_file(DIR + '/' + FILE1, FILE1, 0600);
	fs.write_file(DIR + '/' + FILE2, FILE2, 0600);

	const items = [];
	const indexes = [];

	fs.list_dir(DIR, function(item, i) {
		items.push(item);
		indexes.push(i);

		return false;
	});

	expect.array_equals([0], indexes);
	expect.is(true, items.length === 1);
	expect.is(true, items[0] === FILE1 || items[0] === FILE2);
});

test('mkdir', function() {
	const DIR = '/tmp/joshidir';

	fs.rmdir(DIR, true);
	fs.mkdirp(DIR);

	expect.is(true, fs.is_directory(DIR));
});

test('mkdir > with mode', function() {
	const DIR = '/tmp/joshidir';

	fs.rmdir(DIR, true);
	fs.mkdirp(DIR, 0700);

	expect.is(true, fs.is_directory(DIR));
	expect.is(0700, fs.stat(DIR).mode & 0777);
});

test('mkdirp', function() {
	const BASEDIR = '/tmp/joshidir';
	const DIR = BASEDIR + '/and/more/dirs';

	fs.rmdir(BASEDIR, true);
	fs.mkdirp(DIR);

	expect.is(true, fs.is_directory(DIR));

	fs.rmdir(BASEDIR, true);
});

test('mkfifo', function() {
	const FIFO = '/tmp/joshi';

	fs.unlink(FIFO, false);
	fs.mkfifo(FIFO);

	expect.is(true, fs.is_fifo(FIFO));
});

test('normalize_path', function() {
	const CWD = fs.realpath('.');

	expect.is(CWD, fs.normalize_path('.'));
	expect.is(CWD, fs.normalize_path('../' + fs.basename(CWD) + '/.'));
	expect.is('/tmp', fs.normalize_path('/dev/block/../../tmp/./../tmp'));
});

test('read_file', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, 'holi');

	expect.is('holi', fs.read_file(FILE));
});

test('read_link', function() {
	const LINK = '/tmp/joshiln';

	fs.unlink(LINK, false);
	proc.fork(true, function() {
		proc.exec('ln', ['-s', '/tmp', LINK]);
	});

	expect.is('/tmp', fs.read_link(LINK));
});

test('read_link > with relative path', function() {
	const LINK = '/tmp/joshiln';

	fs.unlink(LINK, false);
	proc.fork(true, function() {
		proc.exec('ln', ['-s', '../dev', LINK]);
	});

	expect.is('/tmp/../dev', fs.read_link(LINK));
});

test('realpath', function() {
	expect.is('/etc/passwd', fs.realpath('/tmp/../etc/./passwd'));
	expect.throws(function() {
		fs.realpath('/dev/null/nonexistent');
	});
});

test('rmdir', function() {
	const DIR = '/tmp/joshidir';

	fs.rmdir(DIR, true)
	fs.mkdir(DIR);

	expect.is(true, fs.is_directory(DIR));

	fs.rmdir(DIR);

	expect.is(false, fs.exists(DIR));
});

test('stat', function() {
	const FILE = '/tmp/joshi';
	const NOW = Math.floor(new Date().getTime() / 1000);

	fs.unlink(FILE, false);
	fs.write_file(FILE, '1234', 0200);

	const st = fs.stat(FILE);

	expect.is(proc.getgid(), st.gid);
	expect.is(fs.S_IFREG, (st.mode & fs.S_IFMT));
	expect.is(0200, (st.mode & 0777));
	expect.is(4, st.size);
	expect.is(proc.getuid(), st.uid);

	const t = st.time;

	expect.is(true, t.access >= NOW);
	expect.is(true, t.creation >= NOW);
	expect.is(true, t.modification >= NOW);
});

test('unlink', function() {
	const FILE = '/tmp/joshi';

	fs.unlink(FILE, false);
	fs.write_file(FILE, '');

	fs.unlink(FILE);

	expect.is(false, fs.exists(FILE));

	expect.throws(function() {
		fs.unlink(FILE);
	});

	// shouldn't throw
	fs.unlink(FILE, false);
});

test('write_file', function() {
	const FILE = '/tmp/joshi';

	fs.write_file(FILE, 'holi');

	expect.is('holi', fs.read_file(FILE));
});
