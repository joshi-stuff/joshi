const generate = require('generate.js');

return {
	error: function (v, types, cleanup_code) {
		const name = v.name;

		return [
			'if (' + name + ' == ERR) {',
			generate.tabify(1, cleanup_code),
			'	duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");',
			'	duk_throw(ctx);',
			'}',
		];
	},

	'error-on-null': function (v, types, cleanup_code) {
		const name = v.name;

		return [
			'if (' + name + ' == NULL) {',
			generate.tabify(1, cleanup_code),
			'	duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");',
			'	duk_throw(ctx);',
			'}',
		];
	},

	nothing: function (v, types) {
		return [];
	},
};
