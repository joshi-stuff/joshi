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
			'	joshi_throw_syserror(ctx);',
			'}',
		];
	},

	'errno-alone': function(v, types, cleanup_code) {
		return [
			'if (errno) {',
			generate.tabify(
				1,
				cleanup_code
			),
			'	joshi_throw_syserror(ctx);',
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
			'	joshi_throw_syserror(ctx);',
			'}',
		];
	},

	'nothing': function(v, types) {
		return [];
	}

}
