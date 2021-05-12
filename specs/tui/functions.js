const CUSTOMIZED = function (argc) {
	const args = [];

	for (var i = 0; i < argc; i++) {
		args.push({ type: 'int', name: 'arg' + i });
	}

	return {
		args: args,
		returns: { type: 'int' },
		throws: 'nothing',
	};
};

return {
	curs_set: {
		args: [{ type: 'int', name: 'visibility' }],
		returns: { type: 'int' },
		throws: 'error',
	},

	delwin: {
		args: [{ type: 'WINDOW*', name: 'win' }],
		returns: { type: 'int' },
		throws: 'error',
	},

	endwin: {
		args: [],
		returns: { type: 'int' },
		throws: 'error',
	},

	getmaxyx: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'int', name: 'y', out: true },
			{ type: 'int', name: 'x', out: true },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	getyx: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'int', name: 'y', out: true },
			{ type: 'int', name: 'x', out: true },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	init_color: {
		args: [
			{ type: 'int', name: 'color' },
			{ type: 'int', name: 'r' },
			{ type: 'int', name: 'g' },
			{ type: 'int', name: 'b' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	init_pair: {
		args: [
			{ type: 'int', name: 'pair' },
			{ type: 'int', name: 'fg' },
			{ type: 'int', name: 'bg' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	initscr: CUSTOMIZED(0),

	mvwin: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'int', name: 'y' },
			{ type: 'int', name: 'x' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	newwin: {
		args: [
			{ type: 'int', name: 'nlines' },
			{ type: 'int', name: 'ncols' },
			{ type: 'int', name: 'y' },
			{ type: 'int', name: 'x' },
		],
		returns: { type: 'WINDOW*' },
		throws: 'error-on-null',
	},

	waddstr: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'char*', name: 'str' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	wattr_get: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'attr_t', name: 'attrs', out: true, ref: true },
			{ type: 'short', name: 'pair', out: true, ref: true },
			{ type: 'CONSTANT', name: 'NULL' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	wattr_set: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'attr_t', name: 'attrs' },
			{ type: 'short', name: 'pair' },
			{ type: 'CONSTANT', name: 'NULL' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	wclear: {
		args: [{ type: 'WINDOW*', name: 'win' }],
		returns: { type: 'int' },
		throws: 'error',
	},

	werase: {
		args: [{ type: 'WINDOW*', name: 'win' }],
		returns: { type: 'int' },
		throws: 'error',
	},

	wgetch: CUSTOMIZED(0),

	winsstr: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'char*', name: 'str' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	wmove: {
		args: [
			{ type: 'WINDOW*', name: 'win' },
			{ type: 'int', name: 'y' },
			{ type: 'int', name: 'x' },
		],
		returns: { type: 'int' },
		throws: 'error',
	},

	wrefresh: {
		args: [{ type: 'WINDOW*', name: 'win' }],
		returns: { type: 'int' },
		throws: 'error',
	},

	// TODO: color_content
	// TODO: pair_content
};
