const fs = require('fs');
const io = require('io');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;
const tmp = require('./test.js').tmp;

test('append', function () {
	const FILE = tmp('append');

	io.close(io.truncate(FILE));

	var fd = io.append(FILE);
	io.write_string(fd, 'line 1');
	io.seek(fd, 0, io.SEEK_SET);
	io.write_string(fd, 'line 2');
	io.close(fd);

	fd = io.open(FILE);
	const str = io.read_string(fd);
	io.close(fd);

	expect.is('line 1line 2', str);
});

test('close', function () {
	const FILE = tmp('close');

	const fd = io.truncate(FILE);
	io.close(fd);

	try {
		io.read_string(fd);
	} catch (err) {
		expect.is(9, err.errno);
	}
});

test('close > with fail_if_closed=false', function () {
	const FILE = tmp('close_with_fail_if_closed_false');

	const fd = io.truncate(FILE);
	io.close(fd);
	io.close(fd, false);
});

test('create', function () {
	const FILE = tmp('create');

	for (var i = 0; ; i++) {
		try {
			io.close(io.open(FILE + i));
		} catch (err) {
			FILE = FILE + i;
			break;
		}
	}

	log('file', FILE);

	io.close(io.create(FILE));

	try {
		io.close(io.open(FILE));
	} catch (err) {
		fail('could not reopen file after creation');
	}

	// Cleanup
	try {
		fs.unlink(FILE);
	} catch (err) {}
});

test('dup', function () {
	const FILE = tmp('dup');

	const fd = io.truncate(FILE);
	io.write_string(fd, 'holi');

	const fd2 = io.dup(fd);
	io.seek(fd2, 0);
	const str = io.read_string(fd2);
	io.close(fd2);

	io.close(fd);

	expect.is('holi', str);
});

test('dup2', function () {
	const FILE = tmp('dup2');

	const fd = io.truncate(FILE);
	io.write_string(fd, 'holi');

	io.dup2(fd, 100);
	io.seek(100, 0);
	const str = io.read_string(100);
	io.close(100);

	io.close(fd);

	expect.is('holi', str);
});

test('open', function () {
	const FILE = tmp('open');

	io.close(io.truncate(FILE));

	const fd = io.open(FILE);
	io.close(fd);

	expect.throws(function () {
		io.open('/tmp/non_existent_file_gdgsahfgsagfs');
	});
});

test('open > for read and write', function () {
	const FILE = tmp('open_for_read_and_write');

	io.close(io.truncate(FILE));

	const fd = io.open(FILE, 'rw');

	io.write_string(fd, 'holi');

	io.seek(fd, 0);

	expect.is('holi', io.read_string(fd));

	io.close(fd);
});

test('open > for read only', function () {
	const FILE = tmp('open_for_read_only');

	io.close(io.truncate(FILE));

	const fd = io.open(FILE, 'r');

	expect.throws(function () {
		io.write_string(fd, 'holi');
	});

	expect.is('', io.read_string(fd));

	io.close(fd);
});

test('open > for write only', function () {
	const FILE = tmp('open_for_write_only');

	io.close(io.truncate(FILE));

	const fd = io.open(FILE, 'w');

	expect.throws(function () {
		io.read_string(fd);
	});

	io.write_string(fd, 'holi');

	io.close(fd);
});

test('pipe', function () {
	const DATA = new Uint8Array([32, 33, 34, 35, 36, 37, 38, 38, 40, 41, 42]);

	const fd = io.pipe();

	io.write(fd[1], DATA);
	const buf = new Uint8Array(DATA.length);
	io.read(fd[0], buf);

	io.close(fd[0]);
	io.close(fd[1]);

	expect.array_equals(DATA, buf);
});

test('poll', function () {
	const DATA = new Uint8Array([32, 33, 34, 35, 36, 37, 38, 38, 40, 41, 42]);

	const fd = io.pipe();

	const fds = [
		{
			fd: fd[0],
			events: io.POLLIN,
			revents: 0,
		},
	];

	io.write(fd[1], DATA);

	const count = io.poll(fds, 0);

	io.close(fd[0]);
	io.close(fd[1]);

	expect.is(1, count);
	expect.is(io.POLLIN, fds[0].revents);
});

test('read', function () {
	const FILE = tmp('read');
	const DATA = new Uint8Array([32, 33, 34, 35, 36, 37, 38, 38, 40, 41, 42]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);
	io.close(fd);

	const buf = new Uint8Array(DATA.length);

	fd = io.open(FILE);
	io.read(fd, buf);
	io.close(fd);

	expect.array_equals(DATA, buf);
});

test('read > with given count', function () {
	const FILE = tmp('read_with_given_count');
	const DATA = new Uint8Array([32]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);
	io.close(fd);

	const buf = new Uint8Array(3);

	fd = io.open(FILE);
	const bread = io.read(fd, buf, buf.length);
	io.close(fd);

	expect.is(1, bread);
	expect.is(32, buf[0]);
});

test('read_fully', function () {
	const FILE = tmp('read_fully');

	const data = new Uint8Array(4096 * 4 + 512);

	for (var i = 0; i < data.length; i++) {
		data[i] = 255 * Math.random();
	}

	var fd = io.truncate(FILE);
	io.write(fd, data);
	io.close(fd);

	fd = io.open(FILE);
	const buf = io.read_fully(fd);
	const last_bread = io.read(fd, new Uint8Array(1));
	io.close(fd);

	expect.is(0, last_bread);
	expect.array_equals(data, buf);
});

test('read_string', function () {
	const FILE = tmp('read_string');
	const DATA = new Uint8Array([
		0x68, 0x6f, 0x6c, 0x69, 0xf0, 0x9f, 0x94, 0x8a,
	]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);
	io.close(fd);

	fd = io.open(FILE);
	const str = io.read_string(fd);
	io.close(fd);

	expect.is('holi🔊', str);
});

test('seek', function () {
	const FILE = tmp('seek');
	const DATA = new Uint8Array([
		0x68, 0x6f, 0x6c, 0x69, 0xf0, 0x9f, 0x94, 0x8a,
	]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);

	io.seek(fd, -DATA.length, io.SEEK_CUR);
	const buf = io.read_fully(fd);

	io.close(fd);

	expect.array_equals(DATA, buf);
});

test('tell', function () {
	const FILE = tmp('tell');
	const DATA = new Uint8Array([
		0x68, 0x6f, 0x6c, 0x69, 0xf0, 0x9f, 0x94, 0x8a,
	]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);

	const p1 = io.tell(fd);
	io.seek(fd, -3, io.SEEK_END);
	const p2 = io.tell(fd);

	io.close(fd);

	expect.is(DATA.length, p1);
	expect.is(DATA.length - 3, p2);
});

test('truncate', function () {
	const FILE = tmp('truncate');
	const DATA = new Uint8Array([
		0x68, 0x6f, 0x6c, 0x69, 0xf0, 0x9f, 0x94, 0x8a,
	]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA);
	io.close(fd);

	fd = io.truncate(FILE);

	io.seek(fd, 0, io.SEEK_END);
	const p = io.tell(fd);

	io.close(fd);

	expect.is(0, p);
});

test('write > with given count', function () {
	const FILE = tmp('write_with_given_count');
	const DATA = new Uint8Array([32, 33, 34, 35, 36, 37]);

	var fd = io.truncate(FILE);
	io.write(fd, DATA, 3);
	io.close(fd);

	fd = io.open(FILE);
	const buf = io.read_fully(fd);
	io.close(fd);

	expect.is(3, buf.length);
	expect.array_equals([32, 33, 34], buf);
});

test('write_string', function () {
	const FILE = tmp('write_string');
	const DATA = new Uint8Array([
		0x68, 0x6f, 0x6c, 0x69, 0xf0, 0x9f, 0x94, 0x8a,
	]);

	var fd = io.truncate(FILE);
	io.write_string(fd, 'holi🔊');
	io.close(fd);

	fd = io.open(FILE);
	const buf = io.read_fully(fd);
	io.close(fd);

	expect.array_equals(DATA, buf);
});
