const fs = require('fs');
const io = require('io');
const stream = require('stream');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;
const tmp = require('./test.js').tmp;

test('read_line', function () {
	const FILE = tmp('read_line');

	const fd = io.truncate(FILE);
	io.write_string(fd, 'holi\nadios\nincomplete');
	io.seek(fd, 0);

	const sd = stream.create(fd);

	expect.is('holi', stream.read_line(sd));
	expect.is('adios', stream.read_line(sd));
	expect.is(null, stream.read_line(sd));

	io.close(fd);
});

test('read_until', function () {
	const FILE = tmp('read_until');

	const fd = io.truncate(FILE);
	io.write_string(fd, 'error:message,5\n');
	io.seek(fd, 0);

	const sd = stream.create(fd);

	expect.is('error', stream.read_until(sd, ':'));
	expect.is('message', stream.read_until(sd, ','));
	expect.is('5', stream.read_line(sd));
	expect.is(null, stream.read_line(sd));

	io.close(fd);
});

test('read_until > string delimiter', function () {
	const FILE = tmp('read_until');

	const fd = io.truncate(FILE);
	io.write_string(fd, 'holi|||adios|||incomplete\n');
	io.seek(fd, 0);

	const sd = stream.create(fd);

	expect.is('holi', stream.read_until(sd, '|||'));
	expect.is('adios', stream.read_until(sd, '|||'));
	expect.is(null, stream.read_until(sd, '|||'));

	io.close(fd);
});
