const generate = require('generate.js');

return {
	error: function (v, types, cleanup_code) {
		const name = v.name;

		return [
			'if (dbus_error_is_set(&' + name + ')) {',
			generate.tabify(1, cleanup_code),
			'	duk_push_error_object(ctx, DUK_ERR_ERROR, ' + name + '.message);',
			'	dbus_error_free(&' + name + ');',
			'	duk_throw(ctx);',
			'}',
		];
	},

	nothing: function (v, types) {
		return [];
	},
};
