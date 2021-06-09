const tui = require('tui');

const Widget = require('./Widget.js');
const util = require('./internal/util.js');

// TODO: implement filtering

/**
 * @event ListBox#selected_item_changed
 */

/**
 * @class
 * @extends Widget
 * @param {object<string,*>} [props={}]
 */
function ListBox(props) {
	ListBox.superclass.call(
		this,
		{
			header: undefined,
			items: [],
			header_draw_mode: tui.get_draw_mode(tui.stdscr),
			items_draw_mode: tui.get_draw_mode(tui.stdscr),
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

Widget.declare(ListBox, {
	draw: function () {
		const win = this.get_win();
		const header = this.get_header();
		const items = this.get_items();
		const size = this.get_size();

		this.super.draw();

		var initial_row = 1;

		if (header) {
			tui.set_draw_mode(win, this.get_header_draw_mode());
			tui.print(win, 1, 1, header);
			initial_row = 3;
		}

		const first_item_index = get_first_item_index(this);

		tui.set_draw_mode(win, this.get_items_draw_mode());

		for (
			var row = initial_row, i = first_item_index;
			row <= size.rows && i < items.length;
			row++, i++
		) {
			if (i === this._selected_index) {
				tui.set_draw_mode(win, this.get_selected_draw_mode());
			}

			tui.print(this.get_win(), row, 1, items[i]);

			if (i === this._selected_index) {
				tui.set_draw_mode(win, this.get_items_draw_mode());
			}
		}
	},

	/**
	 * Get header text
	 *
	 * @returns {string}
	 * @memberof ListBox#
	 */
	get_header: function () {
		return this._header;
	},

	/**
	 * Get header draw mode
	 *
	 * @returns {DrawMode}
	 * @memberof ListBox#
	 */
	get_header_draw_mode: function () {
		return this._header_draw_mode;
	},

	/**
	 * Get items
	 *
	 * @returns {string[]}
	 * @memberof ListBox#
	 */
	get_items: function () {
		return this._items;
	},

	/**
	 * Get items draw mode
	 *
	 * @returns {DrawMode}
	 * @memberof ListBox#
	 */
	get_items_draw_mode: function () {
		return this._items_draw_mode;
	},

	/**
	 * Get number of visible items that fit in the list
	 *
	 * @returns {number}
	 * @memberof ListBox#
	 */
	get_page_size: function () {
		var page_size = this.get_size().rows;

		if (this.get_header()) {
			page_size -= 2;
		}

		return page_size;
	},

	/**
	 * Get the index of the selected item (starting at 0)
	 *
	 * @returns {number}
	 * @memberof ListBox#
	 */
	get_selected_index: function () {
		return this._selected_index;
	},

	/**
	 * Get the value of the selected item
	 *
	 * @returns {string}
	 * @memberof ListBox#
	 */
	get_selected_item: function () {
		return this._items[this._selected_index];
	},

	/**
	 * Get selected item draw mode. Note that selected draw mode is computed as
	 * the reverse of the items draw mode, thus it cannot be set.
	 *
	 * @returns {DrawMode}
	 * @memberof ListBox#
	 */
	get_selected_draw_mode: function () {
		return this._selected_draw_mode;
	},

	/**
	 * Select previous item
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_prev: function () {
		this._move_selection(-1);
	},

	/**
	 * Select next item
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_next: function () {
		this._move_selection(1);
	},

	/**
	 * Select first item
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_home: function () {
		this._move_selection(-this._selected_index);
	},

	/**
	 * Select last item
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_end: function () {
		this._move_selection(this._items.length - this._selected_index - 1);
	},

	/**
	 * Select item one page up
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_prev_page: function () {
		this._move_selection(-this.get_page_size());
	},

	/**
	 * Select item one page down
	 *
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	go_next_page: function () {
		this._move_selection(this.get_page_size());
	},

	/**
	 * Set header text
	 *
	 * @param {string} header
	 * @memberof ListBox#
	 */
	set_header: function (header) {
		this._header = header;
		this.invalidate();
	},

	/**
	 * Set header draw mode
	 *
	 * @param {DrawMode} header_draw_mode
	 * @memberof ListBox#
	 */
	set_header_draw_mode: function (header_draw_mode) {
		this._header_draw_mode = header_draw_mode;
		this.invalidate();
	},

	/**
	 * Set items
	 *
	 * @param {string[]} items
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	set_items: function (items) {
		this._items = items;
		this.set_selected_index(0);
		this.invalidate();
	},

	/**
	 * Set items draw mode
	 *
	 * @param {DrawMode} items_draw_mode
	 * @memberof ListBox#
	 */
	set_items_draw_mode: function (items_draw_mode) {
		this._items_draw_mode = items_draw_mode;
		this._selected_draw_mode = util.reverse_draw_mode(
			this._items_draw_mode
		);

		this.invalidate();
	},

	/**
	 * Set selected item by index (starting at 0)
	 *
	 * @param {number} index
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 */
	set_selected_index: function (index) {
		if (index < 0 || (this._items.length && index >= this._items.length)) {
			throw new Error('Invalid index: ' + index);
		}

		this._selected_index = index;
		this.invalidate();

		this._fire('selected_item_changed');
	},

	/**
	 * Move selection an amount of items (positive to move downwards, negative
	 * to go back). Note that if bounds are surpassed, the method does not fail
	 * but corrects the amount automatically.
	 *
	 * @param {number} amount Number of items to move
	 * @fires ListBox#selected_item_changed
	 * @memberof ListBox#
	 * @private
	 */
	_move_selection: function (amount) {
		this._selected_index += amount;
		this._selected_index = Math.max(0, this._selected_index);
		this._selected_index = Math.min(
			this._items.length - 1,
			this._selected_index
		);

		this.invalidate();

		this._fire('selected_item_changed');
	},
});

function get_first_item_index(lb) {
	const page_size = lb.get_page_size();
	const half_page_size = Math.floor(page_size / 2);
	const items_count = lb.get_items().length;
	const sel_index = lb.get_selected_index();

	var first_item_index = sel_index - half_page_size;

	first_item_index = Math.min(first_item_index, items_count - page_size);
	first_item_index = Math.max(0, first_item_index);

	return first_item_index;
}

return ListBox;
