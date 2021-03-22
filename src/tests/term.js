const io = require('io');
const proc = require('proc');
const term = require('term');

const expect = require('./test.js').expect;
const fail = require('./test.js').fail;
const log = require('./test.js').log;
const test = require('./test.js').run;

test('bg', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.bg(1, 2, 3);
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is(true, out.includes('48;2;1;2;3m'));
});

test('clear', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.clear();
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is(true, out.includes('2J'));
});

test('fg', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.fg(1, 2, 3);
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is(true, out.includes('38;2;1;2;3m'));
});

test('hide_cursor', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.hide_cursor();
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is(true, out.includes('?25l'));
});

test('move_to', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.move_to(7, 13);
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is(true, out.includes('7;13H'));
});

test('print', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.print('holi');
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is('holi', out);
});

test('print2', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 2);

		term.print2('holi');
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is('holi', out);
});

test('println', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 1);

		term.println('holi');
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is('holi\n', out);
});

test('println2', function() {
	const fd = io.pipe();

	proc.fork(true, function() {
		io.close(fd[0]);
		io.dup2(fd[1], 2);

		term.println2('holi');
	});

	io.close(fd[1]);
	const out = io.read_string(fd[0]);
	io.close(fd[0]);

	expect.is('holi\n', out);
});

