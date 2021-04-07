const term = require('term');

const jt = require('joshi_tui.so');

/**
 * @typedef {object} DrawMode
 * @property {number} attrs Text attribute flags
 * @property {number} pair A color pair number
 */

/**
 * @typedef {object} Window
 * @property {string} is_a Always contains 'Window'
 * @property {Uint8Array} handle Opaque handle to window 
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
 * @enum {number}
 * @exports tui 
 * @readonly
 */
const tui = {
	/** Bitmask to extract attributes */
	A_ATTRIBUTES: 0xFFFFFF00,
	/** Bitmask to extract a character */
	A_CHARTEXT:   0x000000FF,
	/** Bitmask to extract a color (?) */
	A_COLOR:      0x0000FF00,

	/** Normal display */
	A_NORMAL:     0x00000000,
	/** Best hightlighting mode of terminal */
	A_STANDOUT:   0x00010000,
	/** Underlining */
	A_UNDERLINE:  0x00020000,
	/** Reverse video */
	A_REVERSE:    0x00040000,
	/** Blinking */
	A_BLINK:      0x00080000,
	/** Half bright */
	A_DIM:        0x00100000,
	/** Extra bright or bold */
	A_BOLD:       0x00200000,
	/** Alternate character set */
	A_ALTCHARSET: 0x00400000,
	/** Invisible or blank mode */
	A_INVIS:      0x00800000,
	/** Protected mode */
	A_PROTECT:    0x01000000,

	A_HORIZONTAL: 0x02000000,
	A_LEFT:       0x04000000,
	A_LOW:        0x08000000,
	A_RIGHT:      0x10000000,
	A_TOP:        0x20000000,
	A_VERTICAL:   0x40000000,

	COLOR_BLACK:   0,
	COLOR_RED:     1,
	COLOR_GREEN:   2,
	COLOR_YELLOW:  3,
	COLOR_BLUE:    4,
	COLOR_MAGENTA: 5,
	COLOR_CYAN:    6,
	COLOR_WHITE:   7,

	can_change_color: undefined,
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
 * @param {boolean} visible 
 */
tui.curs_set = function(visible) {
	// we don't support "very visible" cursor (value 2) for the moment
	jt.curs_set(visible ? 1 : 0);
}

/**
 * @returns {DrawMode}
 */
tui.get_draw_mode = function(win) {
	win = win || tui.stdscr;

	const ret = jt.wattr_get(win.handle, null);

	return {
		attrs: ret.attrs,
		pair: ret.pair,
	};
}

/**
 * Get the position of the cursor in a window.
 * 
 * @param {Window} [win={@link module:tui.stdscr}]
 * @returns {WindowPos} The cursor position 
 */
tui.get_pos = function(win) {
	win = win || tui.stdscr;

	const ret = jt.getyx(win.handle);

	return {
		row: ret.y + 1,
		col: ret.x + 1,
	};
}

/**
 * Get the size of a window, i.e., number or row and columns.
 * 
 * @param {Window} [win={@link module:tui.stdscr}]
 * @returns {WindowSize} The window size
 */
tui.get_size = function(win) {
	win = win || tui.stdscr;

	const ret = jt.getmaxyx(win.handle);

	return {
		rows: ret.y + 1,
		cols: ret.x + 1
	};
}

/**
 * @returns {void} 
 */
tui.init = function() {
	if (tui.stdscr) {
		throw new Error('Screen has been already initialized');
	}

	const info = jt.initscr();

	tui.can_change_color = info.can_change_color;
	tui.has_colors = info.has_colors;
	tui.max_color_pairs = info.max_color_pairs;
	tui.max_colors = info.max_colors;

	tui.stdscr = {
		handle: info.win,
		is_a: 'Window',
	};
}

tui.init_pair = function(pair, fg, bg) {
	jt.init_pair(pair, fg, bg);
}

/**
 * @param {Window} [win={@link module:tui.stdscr}]
 * @param {number} row Row coordinate (starts at 1)
 * @param {number} col Column coordinate (starts at 1)
 */
tui.move = function(win, row, col) {
	if (col === undefined) {
		col = row;
		row = win;
		win = tui.stdscr;
	}

	jt.wmove(win.handle, row-1, col-1);
}

/**
 * @param {Window} [win={@link module:tui.stdscr}]
 * @param {...*} items Items to print
 */
tui.print = function() {
	if (arguments.length === 0) {
		return;
	}

	var win = arguments[0];
	var first_item_index = 1;

	if (typeof win !== 'object' || win.is_a !== 'Window') {
		first_item_index = 0;
		win = tui.stdscr;
	}

	var str = '';

	for (var i = first_item_index; i < arguments.length; i++) {
		if (i > first_item_index) {
			str += ' ';
		}

		str += term.to_string(arguments[i]);
	}

	jt.waddstr(win.handle, str);
}

/**
 * @returns {int} A key code
 */
tui.getch = function() {
	return jt.wgetch();
}

tui.end = function() {
	jt.endwin();
}

/**
 * @param {Window} [win={@link module:tui.stdscr}]
 */
tui.refresh = function(win) {
	win = win || tui.stdscr;

	jt.wrefresh(win.handle);
}

/**
 * @param {DrawMode} mode
 */
tui.set_draw_mode = function(win, mode) {
	if (mode === undefined) {
		mode = win;
		win = tui.stdscr;
	}

	jt.wattr_set(win.handle, mode.attrs, mode.pair, null);
}

return tui;

