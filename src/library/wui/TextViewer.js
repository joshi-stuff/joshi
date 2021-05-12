const tui = require('tui');

const Widget = require('./Widget.js');

/**
 * @class
 * @extends Widget
 * @param {object<string,*>} [props={}]
 */
function TextViewer(props) {
	TextViewer.superclass.call(
		this,
		{
			header: undefined,
			lines: [],
			header_draw_mode: tui.get_draw_mode(tui.stdscr),
			lines_draw_mode: tui.get_draw_mode(tui.stdscr),
			keymap: [
				tui.KEY_UP,
				'go_prev',
				tui.KEY_DOWN,
				'go_next',
				tui.KEY_HOME,
				'go_home',
				tui.KEY_END,
				'go_end',
				tui.KEY_PPAGE,
				'go_prev_page',
				tui.KEY_NPAGE,
				'go_next_page',
			],
		},
		props
	);
}

Widget.declare(TextViewer, {
	draw: function () {
		const win = this.get_win();
		const header = this.get_header();
		const lines = this.get_lines();
		const size = this.get_size();

		this.super.draw();

		var initial_row = 1;

		if (header) {
			tui.set_draw_mode(win, this.get_header_draw_mode());
			tui.print(win, 1, 1, header);
			initial_row = 3;
		}

		tui.set_draw_mode(win, this.get_lines_draw_mode());

		for (
			var row = initial_row, i = this._first_line_index;
			row <= size.rows && i < lines.length;
			row++, i++
		) {
			tui.print(this.get_win(), row, 1, lines[i]);
		}
	},

	/**
	 * Get header text
	 *
	 * @returns {string}
	 * @memberof TextViewer#
	 */
	get_header: function () {
		return this._header;
	},

	/**
	 * Get header draw mode
	 *
	 * @returns {DrawMode}
	 * @memberof TextViewer#
	 */
	get_header_draw_mode: function () {
		return this._header_draw_mode;
	},

	/**
	 * Get text lines
	 *
	 * @returns {string[]}
	 * @memberof TextViewer#
	 */
	get_lines: function () {
		return this._lines;
	},

	/**
	 * Get lines draw mode
	 *
	 * @returns {DrawMode}
	 * @memberof TextViewer#
	 */
	get_lines_draw_mode: function () {
		return this._lines_draw_mode;
	},

	/**
	 * Get number of visible items that fit in the list
	 *
	 * @returns {number}
	 * @memberof TextViewer#
	 */
	get_page_size: function () {
		var page_size = this.get_size().rows;

		if (this.get_header()) {
			page_size -= 2;
		}

		return page_size;
	},

	/**
	 * Scroll one line up
	 *
	 * @memberof TextViewer#
	 */
	go_prev: function () {
		this._scroll(-1);
	},

	/**
	 * Scroll one line down
	 *
	 * @memberof TextViewer#
	 */
	go_next: function () {
		this._scroll(1);
	},

	/**
	 * Scroll to first line
	 *
	 * @memberof TextViewer#
	 */
	go_home: function () {
		this._first_line_index = 0;
		this.invalidate();
	},

	/**
	 * Scroll to last line
	 *
	 * @memberof TextViewer#
	 */
	go_end: function () {
		const line_count = this._lines.length;

		this._first_line_index = Math.max(
			0,
			line_count - this.get_page_size() + 1
		);
		this.invalidate();
	},

	/**
	 * Scroll one page up
	 *
	 * @memberof TextViewer#
	 */
	go_prev_page: function () {
		this._scroll(-this.get_page_size());
	},

	/**
	 * Scroll one page down
	 *
	 * @memberof TextViewer#
	 */
	go_next_page: function () {
		this._scroll(this.get_page_size());
	},

	/**
	 * Set header text
	 *
	 * @param {string} header
	 * @memberof TextViewer#
	 */
	set_header: function (header) {
		this._header = header;
		this.invalidate();
	},

	/**
	 * Set header draw mode
	 *
	 * @param {DrawMode} header_draw_mode
	 * @memberof TextViewer#
	 */
	set_header_draw_mode: function (header_draw_mode) {
		this._header_draw_mode = header_draw_mode;
		this.invalidate();
	},

	/**
	 * Set text lines
	 *
	 * @param {string[]} lines
	 * @memberof TextViewer#
	 */
	set_lines: function (lines) {
		this._lines = lines;
		this._first_line_index = 0;
		this.invalidate();
	},

	/**
	 * Set lines draw mode
	 *
	 * @param {DrawMode} lines_draw_mode
	 * @memberof TextViewer#
	 */
	set_lines_draw_mode: function (lines_draw_mode) {
		this._lines_draw_mode = lines_draw_mode;
		this.invalidate();
	},

	/**
	 * Scroll an amount of lines (positive to move downwards, negative to go
	 * back). Note that if bounds are surpassed, the method does not fail but
	 * corrects the amount automatically.
	 *
	 * @param {number} amount Number of lines to move
	 *
	 * @returns {number}
	 * The resulting line number (possibly corrected by bounds). Index is 0
	 * based.
	 *
	 * @memberof TextViewer#
	 * @private
	 */
	_scroll: function (amount) {
		const line_count = this._lines.length;
		const page_size = this.get_size().rows;

		const index = this._first_line_index;

		index += amount;
		index = Math.min(line_count - page_size + 1, index);
		index = Math.max(0, index);

		if (index !== this._first_line_index) {
			this._first_line_index = index;
			this.invalidate();
		}

		return this._first_line_index;
	},
});

return TextViewer;
