const fs = require('fs');
const proc = require('proc');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;
const tmp = require('./test.js').tmp;

test('basename', function() {
	expect.is('holi', fs.basename('/usr/share/holi'));
	expect.is('holi', fs.basename('holi'));
});

test('chown', function() {
	const FILE = tmp('chown');

	fs.write_file(FILE, '');

	// We cannot assign our files to any other user, so we just do a light test
	fs.chown(FILE, proc.getuid(), proc.getgid());

	const st = fs.stat(FILE);

	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
});

test('chown > for symlink', function() {
	const LINK = tmp('chown_for_symlink');

	fs.symlink('/etc/passwd', LINK);

	// We cannot assign our files to any other user, so we just do a light test
	fs.chown(LINK, proc.getuid(), proc.getgid());

	const st = fs.stat(LINK);

	expect.is(proc.getuid(), st.uid);
	expect.is(proc.getgid(), st.gid);
});

test('copy_file', function() {
	const SRC = tmp('copy_file_src');
	const DEST = tmp('copy_file_dest');
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
	const FILE = tmp('exists');

	fs.write_file(FILE, '');

	expect.is(true, fs.exists(FILE));
});

test('is_block_device', function() {
	var DEV = '/dev/loop0';
	
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
	const FILE = tmp('is_executable');

	fs.write_file(FILE, '', 0700);

	expect.is(true, fs.is_executable(FILE));

	fs.unlink(FILE, false);
	fs.write_file(FILE, '', 0600);

	expect.is(false, fs.is_executable(FILE));
});

test('is_fifo', function() {
	const FIFO = tmp('is_fifo');

	fs.mkfifo(FIFO);

	expect.is(true, fs.is_fifo(FIFO));
	expect.is(false, fs.is_fifo('/dev'));
	expect.is(false, fs.is_fifo('/dev/null'));
});

test('is_file', function() {
	const FILE = tmp('is_file');

	fs.write_file(FILE, '');

	expect.is(true, fs.is_file(FILE));
	expect.is(false, fs.is_file('/dev'));
	expect.is(false, fs.is_file('/dev/null'));
});

test('is_link', function() {
	const LINK = tmp('is_link');

	fs.symlink('/tmp', LINK);

	expect.is(true, fs.is_link(LINK));
	expect.is(false, fs.is_link('/'));
});

test('is_readable', function() {
	const FILE = tmp('is_readable');

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
	const FILE = tmp('is_writable');
	const FILE2 = tmp('is_writable_2');

	fs.write_file(FILE, '', 0600);

	expect.is(true, fs.is_writable(FILE));

	fs.copy_file(FILE, FILE2, 0400);

	expect.is(false, fs.is_writable(FILE2));
});

test('join', function() {
	expect.is('/etc', fs.join('/', 'etc'));
	expect.is('/etc/passwd', fs.join('/etc', 'passwd'));
	expect.is('/etc/nginx/nginx.conf', fs.join('/etc', 'nginx/nginx.conf'));
	expect.is(fs.normalize_path('tmp/file'), fs.join('tmp', 'file'));
	expect.throws(function() {
		fs.join('/etc', '/passwd');
	});
});

test('list_dir', function() {
	const DIR = tmp('list_dir');
	const FILE1 = 'file1';
	const FILE2 = 'file2';

	fs.mkdirp(DIR);

	fs.write_file(DIR + '/' + FILE1, FILE1, 0600);
	fs.write_file(DIR + '/' + FILE2, FILE2, 0600);

	const items = fs.list_dir(DIR).sort();

	expect.is(2, items.length);
	expect.is(FILE1, items[0]);
	expect.is(FILE2, items[1]);
});

test('list_dir > with callback', function() {
	const DIR = tmp('list_dir_with_callback');
	const FILE1 = 'file1';
	const FILE2 = 'file2';

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
	const DIR = tmp('list_dir_with_callback_cancelling');
	const FILE1 = 'file1';
	const FILE2 = 'file2';

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
	const DIR = tmp('mkdir');

	fs.mkdirp(DIR);

	expect.is(true, fs.is_directory(DIR));
});

test('mkdir > with mode', function() {
	const DIR = tmp('mkdir_with_mode');

	fs.mkdirp(DIR, 0700);

	expect.is(true, fs.is_directory(DIR));
	expect.is(0700, fs.stat(DIR).mode & 0777);
});

test('mkdirp', function() {
	const BASEDIR = tmp('mkdirp');
	const DIR = BASEDIR + '/and/more/dirs';

	fs.mkdirp(DIR);

	expect.is(true, fs.is_directory(DIR));

	fs.rmdir(BASEDIR, true);
});

test('mkfifo', function() {
	const FIFO = tmp('mkfifo');

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
	const FILE = tmp('read_file');

	fs.write_file(FILE, 'holi');

	expect.is('holi', fs.read_file(FILE));
});

test('read_link', function() {
	const LINK = tmp('read_link');

	fs.symlink('/tmp', LINK);

	expect.is('/tmp', fs.read_link(LINK));
});

test('read_link > with relative path', function() {
	const LINK = tmp('read_link_with_relative_path');

	fs.symlink('../dev', LINK);

	expect.is(fs.dirname(LINK) + '/../dev', fs.read_link(LINK));
});

test('realpath', function() {
	expect.is('/etc/passwd', fs.realpath('/tmp/../etc/./passwd'));
	expect.throws(function() {
		fs.realpath('/dev/null/nonexistent');
	});
});

test('rename', function() {
	const FILE = tmp('rename');
	const TARGET = tmp('rename_target');

	fs.write_file(FILE, 'holi');
	fs.rename(FILE, TARGET);

	expect.is(false, fs.exists(FILE));
	expect.is('holi', fs.read_file(TARGET));

});

test('rmdir', function() {
	const DIR = tmp('rmdir');

	fs.mkdir(DIR);

	expect.is(true, fs.is_directory(DIR));

	fs.rmdir(DIR);

	expect.is(false, fs.exists(DIR));
});

test('stat', function() {
	const FILE = tmp('stat');
	const NOW = Math.floor(new Date().getTime() / 1000);

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

test('symlink', function() {
	const LINK = tmp('symlink');

	fs.symlink('/etc/passwd', LINK);

	const contents = fs.read_file('/etc/passwd');

	expect.is(contents, fs.read_file(LINK));
});

test('unlink', function() {
	const FILE = tmp('unlink');

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
	const FILE = tmp('write_file');

	fs.write_file(FILE, 'holi');

	expect.is('holi', fs.read_file(FILE));
});
