const jt = require('joshi_tui.so');
const term = require('term');

/**
 * @typedef {object} DrawMode
 * @property {number} attrs Text attribute flags
 * @property {number} pair A color pair number
 */

/**
 * @typedef {object} Window
 * @property {string} is_a Always contains 'Window'
 * @property {Uint8Array} handle Opaque handle to window
 * @property {WindowBorder} [border] Optional border definition
 * @property {WindowSize} [size] Cached window size (can be missing)
 * @property {DrawMode} draw_mode Window draw mode
 */

/**
 * @typedef {object} WindowBorder
 * @param {string} lt
 * @param {string} t
 * @param {string} rt
 * @param {string} r
 * @param {string} rb
 * @param {string} b
 * @param {string} lb
 * @param {string} l
 * @see {@link module:tui.DEFAULT_BORDER}
 */

/**
 * @typedef {object} WindowPadding
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 */

/**
 * @typedef {object} WindowPos
 * @property {number} row
 * @property {number} col
 */

/**
 * @typedef {object} WindowSize
 * @property {number} rows
 * @property {number} cols
 */

/**
 * Default draw mode to use when clearing window or painting borders
 *
 * @see {@link module:tui.set_default_draw_mode}
 * @private
 */
var default_draw_mode;

/**
 * Cursor position (relative to {@link module:tui.stdscr}
 *
 * @type {WindowPos}
 * @private
 */
const cursor = {
	row: 1,
	col: 1,
};

/**
 * Next color id to use when calling {@link module:tui.add_colors}
 * @module tui
 * @private
 */
var next_color = 8;

/**
 * Next color pair id to use when calling {@link module:tui.add_draw_modes}
 * @private
 */
var next_pair = 1;

/**
 * @enum {number}
 * @exports tui
 * @readonly
 */
const tui = {
	/** Bitmask to extract attributes */
	A_ATTRIBUTES: 0xffffff00,
	/** Bitmask to extract a character */
	A_CHARTEXT: 0x000000ff,
	/** Bitmask to extract a color (?) */
	A_COLOR: 0x0000ff00,

	/** Normal display */
	A_NORMAL: 0x00000000,
	/** Best hightlighting mode of terminal */
	A_STANDOUT: 0x00010000,
	/** Underlining */
	A_UNDERLINE: 0x00020000,
	/** Reverse video */
	A_REVERSE: 0x00040000,
	/** Blinking */
	A_BLINK: 0x00080000,
	/** Half bright */
	A_DIM: 0x00100000,
	/** Extra bright or bold */
	A_BOLD: 0x00200000,
	/** Alternate character set */
	A_ALTCHARSET: 0x00400000,
	/** Invisible or blank mode */
	A_INVIS: 0x00800000,
	/** Protected mode */
	A_PROTECT: 0x01000000,

	A_HORIZONTAL: 0x02000000,
	A_LEFT: 0x04000000,
	A_LOW: 0x08000000,
	A_RIGHT: 0x10000000,
	A_TOP: 0x20000000,
	A_VERTICAL: 0x40000000,

	COLOR_BLACK: 0,
	COLOR_RED: 1,
	COLOR_GREEN: 2,
	COLOR_YELLOW: 3,
	COLOR_BLUE: 4,
	COLOR_MAGENTA: 5,
	COLOR_CYAN: 6,
	COLOR_WHITE: 7,

	/**
	 * @type {object}
	 */
	DEFAULT_BORDER: {
		lt: '┌',
		t: '─',
		rt: '┐',
		r: '│',
		rb: '┘',
		b: '─',
		lb: '└',
		l: '│',
	},

	KEY_ESC: 27,
	KEY_ENTER: 10,
	KEY_INSERT: 0513,
	KEY_DEL: 0512,
	KEY_BACKSPACE: 0407,
	KEY_DOWN: 0402,
	KEY_UP: 0403,
	KEY_LEFT: 0404,
	KEY_RIGHT: 0405,
	KEY_F1: 0411,
	KEY_F2: 0412,
	KEY_F3: 0413,
	KEY_F4: 0414,
	KEY_F5: 0415,
	KEY_F6: 0416,
	KEY_F7: 0417,
	KEY_F8: 0420,
	KEY_F9: 0421,
	KEY_F10: 0422,
	KEY_F11: 0423,
	KEY_F12: 0424,
	KEY_HOME: 0406,
	KEY_END: 0550,
	KEY_NPAGE: 0522,
	KEY_PPAGE: 0523,
	KEY_RESIZE: 0632,

	/**
	 * @type {boolean}
	 */
	can_change_color: undefined,

	/**
	 * @type {boolean}
	 */
	has_colors: undefined,
	max_color_pairs: undefined,
	max_colors: undefined,

	/**
	 * The default window, which represents the whole screen
	 * @type {Window}
	 */
	stdscr: undefined,
};

/**
 * Define multiple colors to be used by draw modes
 *
 * @example
 * const colors = tui.add_colors({
 *   WHITE: 'fff',
 *   BLACK: '000',
 *   RED: 'ff0000',
 * });
 *
 * @param {object} definitions
 * An object containing properties where keys represent names and values are
 * strings containing hex values for red, green and blue (as in CSS).
 *
 * @returns {object}
 * An object with the same keys as the {definitions} param but values are
 * replaced by color ids.
 *
 * @see {@link module:tui.add_draw_modes}
 */
tui.add_colors = function (definitions) {
	if (!tui.has_colors) {
		throw new Error('Terminal does not support colors');
	}

	if (!tui.can_change_color) {
		throw new Error('Terminal does not support colors redefinition');
	}

	return Object.entries(definitions).reduce(function (map, entry) {
		const name = entry[0];
		const rgb = entry[1];

		if (rgb.length === 3) {
			rgb = rgb[0] + rgb[0] + rgb[1] + rgb[1] + rgb[2] + rgb[2];
		}

		if (rgb.length !== 6) {
			throw new Error('Invalid color: ' + name);
		}

		const r = (1000 * parseInt(rgb.substring(0, 2), 16)) / 255;
		const g = (1000 * parseInt(rgb.substring(2, 4), 16)) / 255;
		const b = (1000 * parseInt(rgb.substring(4, 6), 16)) / 255;

		if (isNaN(r) || isNaN(g) || isNaN(b)) {
			throw new Error('Invalid color: ' + name);
		}

		const color = next_color;
		jt.init_color(color, r, g, b);
		next_color++;

		map[name] = color;

		return map;
	}, {});

	return color;
};

/**
 * Define multiple draw modes
 *
 * @example
 * const modes = tui.add_draw_modes({
 *   DEFAULT: [tui.A_NORMAL, color.WHITE, color.BLACK],
 *   ERROR: [tui.A_BOLD, color.RED, color.BLACK],
 * });
 *
 * @param {object} definitions
 * An object containing properties where keys represent names and values are
 * tuples (arrays) of [attrs, fg, bg].
 *
 * @returns {object}
 * An object with the same keys as the {definitions} param but values are
 * replaced by draw mode ids
 */
tui.add_draw_modes = function (definitions) {
	return Object.entries(definitions).reduce(function (map, entry) {
		const name = entry[0];
		const attrs = entry[1][0];
		const fg = entry[1][1];
		const bg = entry[1][2];

		if (isNaN(attrs) || isNaN(fg) || isNaN(bg)) {
			throw new Error('Invalid draw mode: ' + name);
		}

		const pair = next_pair;
		jt.init_pair(pair, fg, bg);
		next_pair++;

		map[name] = {
			attrs: attrs,
			pair: pair,
		};

		return map;
	}, {});
};

/**
 * @param {number} row Row coordinate (starts at 1)
 * @param {number} col Column coordinate (starts at 1)
 * @returns {void}
 */
tui.curs_move = function (row, col) {
	const win = tui.stdscr;

	jt.wmove(win.handle, row - 1, col - 1);

	cursor.row = row;
	cursor.col = col;
};

/**
 * Erase whole window
 *
 * @param {Window} [win={@link module:tui.stdscr}]
 * @see {@link module:tui.clear}
 * @returns {void}
 */
tui.clear = function (win) {
	win = win || tui.stdscr;

	const wsize = tui.get_size(win);

	var line = '';
	for (var i = 0; i < wsize.cols; i++) {
		line += ' ';
	}

	const saved_draw_mode = tui.get_draw_mode(win);
	tui.set_draw_mode(win, default_draw_mode);

	for (var row = 1; row <= wsize.rows; row++) {
		tui.print(win, row, 1, line);
	}

	draw_border(win);
};

/**
 * Get cursor position
 *
 * @returns {WindowPos}
 */
tui.curs_pos = function () {
	return cursor;
};

/**
 * @param {boolean} visible
 * @returns {void}
 */
tui.curs_set = function (visible) {
	// we don't support "very visible" cursor (value 2) for the moment
	jt.curs_set(visible ? 1 : 0);
};

/**
 *
 * @returns {void}
 */
tui.end = function () {
	jt.endwin();
	tui.stdscr = undefined;
};

/**
 * @returns {DrawMode}
 */
tui.get_draw_mode = function (win) {
	win = win || tui.stdscr;

	return win.draw_mode;
};

/**
 * Get the size of a window, i.e., number or row and columns.
 *
 * @param {Window} [win={@link module:tui.stdscr}]
 * @returns {WindowSize} The window size
 */
tui.get_size = function (win) {
	win = win || tui.stdscr;

	if (win.size) {
		return win.size;
	}

	const ret = jt.getmaxyx(win.handle);

	if (win.border) {
		ret.y -= 2;
		ret.x -= 2;
	}

	return {
		rows: ret.y,
		cols: ret.x,
	};
};

/**
 * @returns {int} A key code
 */
tui.getch = function () {
	return jt.wgetch();
};

/**
 * @returns {void}
 */
tui.init = function () {
	if (tui.stdscr) {
		throw new Error('Screen has been already initialized');
	}

	const info = jt.initscr();
	const wattr = jt.wattr_get(info.win, null);

	tui.stdscr = {
		is_a: 'Window',
		handle: info.win,
		draw_mode: {
			attrs: wattr.attrs,
			pair: wattr.pair,
		},
	};

	tui.can_change_color = info.can_change_color;
	tui.has_colors = info.has_colors;
	tui.max_color_pairs = info.max_color_pairs;
	tui.max_colors = info.max_colors;

	tui.set_default_draw_mode(tui.stdscr.draw_mode);
};

/**
 * @param {Window} [win={@link module:tui.stdscr}]
 * @param {number} row
 * @param {number} col
 * @param {...*} items Items to print
 * @returns {void}
 */
tui.print = function () {
	var win = arguments[0];
	var row = arguments[1];
	var col = arguments[2];
	var first_item_index = 3;

	if (win.is_a !== 'Window') {
		col = row;
		row = win;
		win = tui.stdscr;
		first_item_index = 2;
	}

	check_pos(win, row, col);

	const wsize = tui.get_size(win);
	const cols_avail = wsize.cols - col + 1;

	var str = '';

	for (var i = first_item_index; i < arguments.length; i++) {
		if (i > first_item_index) {
			str += ' ';
		}

		str += term
			.to_string(arguments[i])
			.replace('\t', '    ')
			.replace('\n', '↩');

		if (str.length >= cols_avail) {
			break;
		}
	}

	// Clip string
	if (str.length > cols_avail) {
		str = str.substring(0, cols_avail);
	}

	const y = win.border ? row : row - 1;
	const x = win.border ? col : col - 1;

	if (!win.border && row === wsize.rows && col + str.length > wsize.cols) {
		jt.wmove(win.handle, y, x);
		jt.waddstr(win.handle, str.substring(0, str.length - 1));
		jt.winsstr(win.handle, str.substring(str.length - 1));
	} else {
		jt.wmove(win.handle, y, x);
		jt.waddstr(win.handle, str);
	}

	restore_cursor();
};

/**
 * @param {Window} [win={@link module:tui.stdscr}]
 * @returns {void}
 */
tui.refresh = function (win) {
	win = win || tui.stdscr;

	jt.wrefresh(win.handle);
};

/**
 * Set the colors used to clear the screen and draw borders
 *
 * @param {DrawMode} draw_mode
 * @see {@link module:tui.clear}
 */
tui.set_default_draw_mode = function (draw_mode) {
	default_draw_mode = draw_mode;
};

/**
 * @param {DrawMode} mode
 * @returns {void}
 */
tui.set_draw_mode = function (win, mode) {
	if (mode === undefined) {
		mode = win;
		win = tui.stdscr;
	}

	jt.wattr_set(win.handle, mode.attrs, mode.pair, null);
	win.draw_mode = mode;
};

/**
 * Delete an existing {Window}
 *
 * @param {Window} win
 * @returns {void}
 */
tui.win_del = function (win) {
	if (win === tui.stdscr) {
		throw new Error('Window stdscr cannot be deleted');
	}

	jt.delwin(win.handle);
};

/**
 * Move an existing {Window}
 *
 * @param {Window} win
 * @returns {void}
 */
tui.win_move = function (win, row, col) {
	if (win === tui.stdscr) {
		throw new Error('Window stdscr cannot be moved');
	}

	jt.mvwin(win.handle, row - 1, col - 1);
};

/**
 * Create a new {Window} with given coordinates and size
 *
 * @param {number} row
 * @param {number} col
 * @param {number} rows
 * @param {number} cols
 *
 * @param {WindowBorder|boolean} [border=false]
 * An explicit {WindowBorder} object, or {true} to use
 * {@link module:tui.DEFAULT_BORDER}
 *
 * @returns {Window}
 */
tui.win_new = function (row, col, rows, cols, border) {
	if (border === true) {
		border = tui.DEFAULT_BORDER;
	}

	const handle = jt.newwin(rows, cols, row - 1, col - 1);
	const wattr = jt.wattr_get(handle, null);

	const win = {
		is_a: 'Window',
		handle: handle,
		border: border,
		draw_mode: {
			attrs: wattr.attrs,
			pair: wattr.pair,
		},
		size: {
			rows: border ? rows - 2 : rows,
			cols: border ? cols - 2 : cols,
		},
	};

	tui.clear(win);
	draw_border(win);

	return win;
};

function check_pos(win, row, col) {
	const wsize = tui.get_size(win);

	if (row < 1 || row > wsize.rows || col < 1 || col > wsize.cols) {
		throw new Error(
			'Invalid position (' +
				row +
				',' +
				col +
				') for window ' +
				'of size [' +
				wsize.rows +
				'x' +
				wsize.cols +
				']'
		);
	}
}

/**
 * Draw a border around a window
 *
 * @private
 * @param {Window} win
 * @returns {void}
 */
function draw_border(win) {
	if (!win.border) {
		return;
	}

	const border = win.border;

	const maxyx = jt.getmaxyx(win.handle);
	const maxy = maxyx.y - 1;
	const maxx = maxyx.x - 1;

	const saved_draw_mode = tui.get_draw_mode(win);
	tui.set_draw_mode(win, default_draw_mode);

	jt.wmove(win.handle, 0, 0);
	jt.waddstr(win.handle, border.lt);

	jt.wmove(win.handle, 0, maxx);
	jt.waddstr(win.handle, border.rt);

	jt.wmove(win.handle, maxy, maxx);
	jt.winsstr(win.handle, border.rb);

	jt.wmove(win.handle, maxy, 0);
	jt.waddstr(win.handle, border.lb);

	jt.wmove(win.handle, 0, 1);
	for (var i = 0; i < maxx - 1; i++) {
		jt.waddstr(win.handle, border.t);
	}

	jt.wmove(win.handle, maxy, 1);
	for (var i = 0; i < maxx - 1; i++) {
		jt.waddstr(win.handle, border.b);
	}

	for (var y = 1; y <= maxy - 1; y++) {
		jt.wmove(win.handle, y, 0);
		jt.waddstr(win.handle, border.l);
		jt.wmove(win.handle, y, maxx);
		jt.waddstr(win.handle, border.r);
	}

	tui.set_draw_mode(win, saved_draw_mode);

	restore_cursor();
}

function restore_cursor() {
	jt.wmove(tui.stdscr.handle, cursor.row - 1, cursor.col - 1);
}

return tui;
