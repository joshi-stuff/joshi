const proc = require('proc');
const term = require('term');
const tui = require('tui');

/**
 * @typedef WinEntry
 * @property {string} id
 * @property {WinLayoutCallback} layout
 * @property {Window} win
 * @property {Widget} [widget]
 * @private
 */

/**
 * @callback WinLayoutCallback
 * @param {WindowSize} size
 * @returns {Window}
 */

/**
 * @callback WuiRunCallback
 * @param {number} key
 * @returns {boolean}
 */

var debug_enabled = false;

/**
 * @exports wui
 */
const wui = {};

const entries = {};

/**
 *
 * @param {string} id
 * @param {WinLayoutCallback} layout
 * @throws {Error} If window with given id exists
 */
wui.add_win = function (id, layout) {
	if (entries[id]) {
		throw new Error('Window exists: ' + id);
	}

	debug('wui', 'add_win', id);

	entries[id] = {
		id: id,
		layout: layout,
		win: layout(tui.get_size(tui.stdscr)),
		widget: undefined,
	};
};

/**
 * Connects a widget to a window. If the window has a connected widget, it is
 * automatically disconnected.
 *
 * @param {string} id
 * @param {Widget} widget
 * @return {Widget} The given widget
 * @throws {Error} If window with given id doesn't exist
 */
wui.connect = function (id, widget, props) {
	props = props || {};

	const entry = entries[id];

	if (!entry) {
		throw new Error('Window does not exist: ' + id);
	}

	if (entry.widget) {
		debug(widget.class.name + '.' + entry.id, 'set_win', undefined);
		entry.widget.set_win();
	}

	debug(widget, 'connect', id);

	entry.widget = widget;
	widget.set_win(entry.win);
	widget.invalidate();

	return widget;
};

/**
 *
 * @param {string} id
 * @throws {Error} If window with given id does not exist
 */
wui.del_win = function (id) {
	const entry = entries[id];

	if (!entry) {
		throw new Error('Window does not exist: ' + id);
	}

	const widget = entry.widget;

	if (widget) {
		debug(widget.class.name + '.' + entry.id, 'set_win', undefined);
		widget.set_win();
	}

	debug('wui', 'del_win', id);

	delete entries[id];
};

/**
 * Disconnect a widget from its window and return the widget
 *
 * @param {string} id
 * @returns {Widget|undefined}
 */
wui.disconnect = function (id) {
	const entry = entries[id];

	if (!entry) {
		throw new Error('Window does not exist: ' + id);
	}

	const widget = entry.widget;

	if (widget) {
		debug(widget.class.name + '.' + entry.id, 'set_win', undefined);
		widget.set_win();
	}

	debug('wui', 'disconnect', id);

	entry.widget = undefined;
	tui.clear(entry.win);

	return widget;
};

/**
 * Get the widget connected to a given window
 *
 * @param {string} id
 * @returns {Widget|undefined}
 */
wui.get_widget = function (id) {
	const entry = entries[id];

	if (!entry) {
		throw new Error('Window does not exist: ' + id);
	}

	return entry.widget;
};

/**
 * Get a window by id
 *
 * @param {string} id
 * @returns {Widget|undefined}
 */
wui.get_win = function (id) {
	const entry = entries[id];

	if (!entry) {
		throw new Error('Window does not exist: ' + id);
	}

	return entry.win;
};

/**
 *
 */
wui.init = function () {
	tui.init();
	tui.curs_set(false);
	tui.clear();

	proc.atexit(tui.end);
};

/**
 * Redraw the whole screen.
 *
 * This method is provided for batch applications where interaction with the
 * user's keyboard is not needed. In those apps, call this method whenever you
 * want to update the screen, instead of relying on {@link module:wui.run}.
 *
 * Note that, when using this method instead of {@link module:wui.run} you won't
 * detect {@link module:tui.KEY_RESIZE} events, thus the redraws may be
 * incorrect if the size of the terminal changes.
 *
 * In order to avoid the former, you must provide some way to check for resizes
 * at your application's level invoking {@link module:tui.getch}.
 *
 * @returns {void}
 */
wui.redraw = function () {
	draw();
	refresh();
};

 */
wui.relayout = function () {
	const size = tui.get_size(tui.stdscr);

	debug('wui', 'relayout', size);

	Object.values(entries).forEach(function (entry) {
		entry.win = entry.layout(size);

		if (entry.widget) {
			entry.widget.set_win(entry.win);
		}
	});
};

/**
 *
 * @param {WuiRunCallback} cb
 */
wui.run = function (cb) {
	while (true) {
		draw();
		refresh();

		const key = tui.getch();

		debug('wui', 'getch', key);

		if (key === tui.KEY_RESIZE) {
			wui.relayout();
			continue;
		}

		if (cb(key) === false) {
			debug('wui', 'exitting');
			break;
		}
	}
};

/**
 * Routes a key through all enabled widgets
 *
 * @param {number} key
 * @returns {boolean}
 */
wui.send_key = function (key) {
	var result = false;

	debug('wui', 'send_key', key);

	Object.values(entries).forEach(function (entry) {
		const widget = entry.widget;

		if (!widget) {
			return;
		}

		if (widget.get_win() !== entry.win) {
			throw new Error('Invalid widget state in window: ' + entry.id);
		}

		if (widget.is_disabled()) {
			debug(widget.class.name + '.' + entry.id, 'skipped (disabled)');
			return;
		}

		const handled = widget.send_key(key);

		debug(widget.class.name + '.' + entry.id, 'send_key', key, handled);

		result |= handled;
	});

	return result;
};

/**
 * @param {boolean} enabled
 */
wui.set_debug_enabled = function (enabled) {
	debug_enabled = enabled;
};

/**
 * @private
 */
function debug(caller) {
	if (!debug_enabled) {
		return;
	}

	const args = Array.prototype.slice.call(arguments).slice(1);

	if (caller.class) {
		args.unshift(caller.class.name + ':');
	} else {
		args.unshift(caller + ':');
	}

	term.println2.apply(null, args);
}

/**
 * @private
 */
function draw() {
	debug('wui', 'draw');

	Object.values(entries).forEach(function (entry) {
		const widget = entry.widget;

		if (!widget) {
			return;
		}

		if (widget.get_win() !== entry.win) {
			throw new Error('Invalid widget state in window: ' + entry.id);
		}

		if (widget._invalid) {
			debug('wui', 'clear', entry.id);
			tui.clear(entry.win);

			debug(widget.class.name + '.' + entry.id, 'draw');
			widget.draw();

			widget._invalid = false;
		}
	});
}

/**
 * @private
 */
function refresh() {
	debug('wui', 'refresh');

	tui.refresh(tui.stdscr);

	Object.values(entries).forEach(function (entry) {
		tui.refresh(entry.win);
	});
}

return wui;
