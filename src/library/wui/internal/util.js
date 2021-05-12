const tui = require('tui');

const util = {};

util.reverse_draw_mode = function (draw_mode) {
	draw_mode = Object.assign({}, draw_mode);

	if (draw_mode.attrs & tui.A_REVERSE) {
		draw_mode.attrs &= ~tui.A_REVERSE;
	} else {
		draw_mode.attrs |= tui.A_REVERSE;
	}

	return draw_mode;
};

return util;
