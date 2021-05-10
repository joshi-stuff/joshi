const tui = require('tui');

const Widget = require('./Widget.js');
const util = require('./internal/util.js');

// TODO: implement overflow + scroll in LineEditor

/**
 * @event LineEditor#input_changed
 */

/**
 * @class
 * @extends Widget
 * @param {object<string,*>} [props={}] 
 */
function LineEditor(props) {
	LineEditor.superclass.call(this, {
		icon: '🯄 ',
		placeholder: '',
		input: '',
		cursor_pos: 0,
		draw_mode: tui.get_draw_mode(tui.stdscr),
		placeholder_draw_mode: tui.get_draw_mode(tui.stdscr),
		keymap: [
			tui.KEY_LEFT, 'go_left',
			tui.KEY_RIGHT, 'go_right',
			tui.KEY_HOME, 'go_home',
			tui.KEY_END, 'go_end',
			tui.KEY_BACKSPACE, 'do_backspace',
			tui.KEY_DEL, 'do_del',
		]
	}, props);
}

Widget.declare(LineEditor, {

	do_backspace: function() {
		const input = this.get_input();
		const cpos = this.get_cursor_pos();

		if (input.length) {
			this.set_input(input.substring(0, input.length - 1));
			this.set_cursor_pos(cpos-1);
		}
	},

	do_del: function() {
		const input = this.get_input();
		const cpos = this.get_cursor_pos();

		this.set_input(input.substring(0, cpos) + input.substring(cpos + 1));
	},

	draw: function() {
		const win = this.get_win();
		const cpos = this.get_cursor_pos();
		const input = this.get_input();
		const icon = this.get_icon();

		this.super.draw();

		if (input.length) {
			tui.set_draw_mode(win, this.get_draw_mode());
			tui.print(win, 1, 1, icon + ' ' + input);

			// TODO: draw icon + spaces instead of counting 4
			tui.set_draw_mode(win, this.get_cursor_draw_mode());
			if (cpos < input.length) {
				tui.print(win, 1, 4 + cpos, input[cpos]);
			}
			else {
				tui.print(win, 1, 4 + cpos, ' ');
			}
		} 
		else {
			tui.set_draw_mode(win, this.get_placeholder_draw_mode());
			tui.print(win, 1, 1, icon + ' ' + this.get_placeholder());

			tui.set_draw_mode(win, this.get_draw_mode());
			tui.print(win, 1, 1, icon);
		}
	},

	get_cursor_draw_mode: function() {
		return this._cursor_draw_mode;
	},

	get_cursor_pos: function() {
		return this._cursor_pos;
	},

	get_draw_mode: function() {
		return this._draw_mode;
	},

	get_icon: function() {
		return this._icon;
	},

	get_input: function() {
		return this._input;
	},

	get_placeholder: function() {
		return this._placeholder;
	},

	get_placeholder_draw_mode: function() {
		return this._placeholder_draw_mode;
	},

	go_end: function() {
		const input = this.get_input();

		this.set_cursor_pos(input.length);
	},

	go_home: function() {
		this.set_cursor_pos(0);
	},

	go_left: function() {
		const cpos = this.get_cursor_pos();

		this.set_cursor_pos(Math.max(cpos - 1, 0));
	},

	go_right: function() {
		const input = this.get_input();
		const cpos = this.get_cursor_pos();

		this.set_cursor_pos(Math.min(cpos + 1, input.length));
	},

	send_key: function(key) {
		if (this.super.send_key(key)) {
			return true;
		}

		if (key < 32 || key > 255) {
			return false;
		}

		const char = String.fromCharCode(key);
		const input = this.get_input();
		const cpos = this.get_cursor_pos();

		if (cpos >= input.length) {
			this.set_input(input + char);
		}
		else {
			this.set_input( 
				input.substring(0, cpos) + char + input.substring(cpos)
			);
		}
		this.set_cursor_pos(cpos + 1);

		return true;
	},

	set_cursor_pos: function(cursor_pos) {
		const input = this.get_input();

		if (cursor_pos < 0 || cursor_pos > input.length) {
			throw new Error('Cursor out of bounds: ' + cursor_pos);
		}

		this._cursor_pos = cursor_pos;
		this.invalidate();
	},

	set_draw_mode: function(draw_mode) {
		this._draw_mode = draw_mode;
		this._cursor_draw_mode = util.reverse_draw_mode(draw_mode);
		this.invalidate();
	},

	set_icon: function(icon) {
		this._icon = icon;
		this.invalidate();
	},

	set_input: function(input) {
		this._input = input;
		this._cursor_pos = Math.min(this._cursor_pos, input.length);
		this.invalidate();

		this._fire('input_changed');
	},

	set_placeholder: function(placeholder) {
		this._placeholder = placeholder;
		this.invalidate();
	},

	set_placeholder_draw_mode: function(draw_mode) {
		this._placeholder_draw_mode = draw_mode;
		this.invalidate();
	},

});


return LineEditor;

