#!/bin/env joshi

const tui = require('tui');

tui.init();

try {
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 16; x++) {
			const color = 16 * y + x;

			const dm = tui.add_draw_modes({
				X: [tui.A_NORMAL, tui.COLOR_BLACK, color],
			});

			tui.set_draw_mode(dm.X);
			tui.print(
				1 + y,
				1 + x * 2,
				(color < 16 ? '0' : '') + color.toString(16)
			);
		}
	}

	tui.getch();
} catch (err) {
	tui.print(1, 1, err);
	tui.getch();
} finally {
	tui.end();
}

// vi: ft=javascript
