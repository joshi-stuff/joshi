const term = require('term');
const tui = require('tui');

/**
 * @callback WidgetListener
 * @param {Widget} widget
 * @param {string} event
 * @param {object<string,*>} props
 */

/**
 * Widget class
 *
 * @class
 * @param {object<string,*>} [defaultProps={}]
 * @param {object<string,*>} [props={}]
 */
function Widget(defaultProps, props) {
	defaultProps = defaultProps || {};
	props = props || {};

	this._win = undefined;
	this._win_size = undefined;
	this._invalid = true;
	this._keymap = {};
	this._listeners = {};

	this.class = Object.getPrototypeOf(this).constructor;

	const self = this;

	this.super = Object.entries(this.class.superclass.prototype).reduce(
		function (sup, entry) {
			const fn = entry[1];

			if (typeof fn !== 'function') {
				return sup;
			}

			const name = entry[0];

			sup[name] = fn.bind(self);

			return sup;
		},
		{}
	);

	const merged_props = Object.assign({}, defaultProps, props);

	Object.entries(merged_props).forEach(function (entry) {
		self['set_' + entry[0]](entry[1]);
	});
}

Widget.prototype = {
	/**
	 * Draw the widget in the associated window
	 *
	 * @see {Widget#set_win}
	 */
	draw: function () {},

	/**
	 * Return underlying window size
	 *
	 * @returns {WindowSize}
	 */
	get_size: function () {
		return this._win_size;
	},

	/**
	 * Get associated window
	 *
	 * @returns {Window}
	 */
	get_win: function () {
		return this._win;
	},

	/**
	 * Invalidate window contents, i.e.: mark widget as modified so that next
	 * drawing cycle refreshes screen contents.
	 */
	invalidate: function () {
		this._invalid = true;
	},

	/**
	 * Merge some key mappings with current active keymap
	 *
	 * @example
	 *
	 * widget.merge_keymap([
	 *   tui.KEY_UP, 'go_up',
	 *   tui.KEY_DOWN, 'go_down',
	 * ]);
	 *
	 * @param {Array} map
	 * An array of alternating key number, function name elements.
	 *
	 * @see {Widget#set_keymap}
	 */
	merge_keymap: function (map) {
		const keymap = this._keymap;

		for (var i = 0; i < map.length; i += 2) {
			keymap[map[i]] = map[i + 1];
		}
	},

	/**
	 * Send a key to the widget so that it is processed according to the active
	 * keymap.
	 *
	 * @param {number} key Key code
	 * @returns {boolean} Returns true if the key was processed
	 * @see {Widget#set_keymap}
	 */
	send_key: function (key) {
		const keymap = this._keymap;

		if (keymap[key]) {
			return this[keymap[key]](key) !== false;
		}

		if (keymap['*']) {
			return this[keymap['*']](key) !== false;
		}

		return false;
	},

	/**
	 * Overwrite current active keymap with new key mappings
	 *
	 * @example
	 *
	 * widget.set_keymap([
	 *   tui.KEY_UP, 'go_up',
	 *   tui.KEY_DOWN, 'go_down',
	 * ]);
	 *
	 * @param {Array} map
	 * An array of alternating key number, function name elements.
	 *
	 * @see {Widget#merge_keymap}
	 */
	set_keymap: function (map) {
		this._keymap = {};
		this.merge_keymap(map);
	},

	/**
	 * Overwrite current listeners map with a new map
	 *
	 * @param {object<string,WidgetListener>} listeners
	 */
	set_listeners: function (listeners) {
		this._listeners = listeners;
	},

	/**
	 * Set associated window object. Note that this function invalidates the
	 * window contents so that it is cleared on next redraw.
	 *
	 * @param {Window} win
	 */
	set_win: function (win) {
		this._win = win;
		this._win_size = tui.get_size(win);
		this.invalidate();
	},

	/**
	 * Fire a named event (invoke its listener if any)
	 *
	 * @param {string} event
	 * @param {object<string,*>} [props={}]
	 * @returns {boolean} A flag indicating if a listener was invoked
	 * @private
	 */
	_fire: function (event, props) {
		const listener = this._listeners[event];

		if (!listener) {
			return false;
		}

		listener(this, event, props || {});

		return true;
	},
};

/**
 * Define a Widget derived class
 *
 * @param {class} Class The class to define
 * @param {class} [BaseClass=Widget] The base class
 * @param {object} proto The class' prototype object
 * @returns {class} The Class parameter
 */
Widget.declare = function (Class, BaseClass, proto) {
	if (proto === undefined) {
		proto = BaseClass;
		BaseClass = Widget;
	}

	Class.prototype = Object.assign(
		Object.create(BaseClass.prototype),
		{ constructor: Class },
		proto
	);

	Class.superclass = BaseClass;

	return Class;
};

return Widget;
