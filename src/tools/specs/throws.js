const generate = require('../generate.js');

return {

	'errno': function(v, types, cleanup_code) {
		const name = v.name;

		return [
			'if ('+name+' == -1) {',
			generate.tabify(
				1,
				cleanup_code
			),
			'	duk_throw_errno(ctx);',
			'}',
		];
	},

	'errno-on-null': function(v, types, cleanup_code) {
		const name = v.name;

		return [
			'if ('+name+' == NULL) {',
			generate.tabify(
				1,
				cleanup_code
			),
			'	duk_throw_errno(ctx);',
			'}',
		];
	},

	'nothing': function(v, types) {
		return [];
	}

}
