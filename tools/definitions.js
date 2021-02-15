const util = require('./util.js');

function defBuffer(ctype) {
	return {
		in: {
			pre: function(arg, argPos) {
				return (
					ctype + ' ' + arg.name + ' = (' + ctype + ')' +
						'duk_get_buffer_data(ctx, ' + argPos + ', NULL);'
				);
			}
		},
		out: {
			pre: function(arg) {
				return ctype + ' ' + arg.name + ' = malloc(' + arg.size + ');'
			},
			post: function(arg) {
				return (
					'memcpy(' + 
						'duk_push_fixed_buffer(ctx, ' + arg.size + '), ' + 
						arg.name + ', ' +  arg.size + ');\n' +
					'free(' + arg.name + ');'
				);
			}
		}
	};
}

function defNumber(ctype) {
	return {
		// TODO: when in+out, the generation must change
		in: {
			pre: 'duk_get_number'
		},
		out: {
			pre: function(arg) {
				return ctype + ' ' + arg.name + '[1];';
			},
			post: function(arg) {
				return 'duk_push_number(ctx, ' + arg.name + '[0]);';
			}
		},
		ret: 'duk_push_number'
	};
}

function defStructArray(structName, fields) {
	const fieldTypes = {
		'int': {
			get: 'number',
			push: 'int'
		},
		'short int': {
			get: 'number',
			push: 'int'
		}
	};

	return {
		in: {
			pre: function(arg, argPos) {
				var source = '';

				source += 'duk_size_t ' + arg.name + '_length = ';
				source += 'duk_get_length(ctx, ' + argPos + ');\n';

				source += 'struct ' + structName + ' ';
				source += arg.name + '[' + arg.name + '_length];\n';

				source += 'for (duk_size_t i = 0; i < ' + arg.name + '_length; i++) {\n';
				source += '	duk_get_prop_index(ctx, ' + argPos + ', i);\n';
				source += '\n';

				const keys = Object.keys(fields);
				for (var i = 0; i < keys.length; i++) {
					const name = keys[i];
					const type = fields[name];
		
					const jtype = fieldTypes[type].get;

					if (!jtype) {
						throw new Error(
							'Unsupported field type ' + type + ' in struct ' +
								structName);
					}

					source += '	duk_get_prop_string(ctx, -1, "' + name + '");\n';
					source += '	' + arg.name + '[i].' + name + ' = ';
					source += '(' + type + ')duk_get_' + jtype + '(ctx, -1);\n';
					source += '	duk_pop(ctx);\n';
					source += '\n';
				}

				source += '	duk_pop(ctx);\n';
				source += '}';

				return source;
			}
		},
		out: {
			post: function(arg, argPos) {
				var source = '';

				source += 'for (size_t i = 0; i < ' + arg.name + '_length; i++) {\n';
				source += '	duk_get_prop_index(ctx, ' + argPos + ', i);\n';
				source += '\n';

				const keys = Object.keys(fields);
				for (var i = 0; i < keys.length; i++) {
					const name = keys[i];
					const type = fields[name];
		
					const jtype = fieldTypes[type].push;

					if (!jtype) {
						throw new Error(
							'Unsupported field type ' + type + ' in struct ' +
								structName);
					}

					source += '	duk_push_' + jtype + '(ctx, ';
					source += arg.name + '[i].' + name + ');\n';
					source += '	duk_put_prop_string(ctx, -2, "' + name + '");\n';
					source += '\n';
				}

				source += '	duk_pop(ctx);\n';
				source += '}';

				return source;
			}
		},
	};
}

return {
	'char*': {
		in: {
			pre: 'duk_get_string'
		}
	},
	'int': defNumber('int'),
	'int[]': {
		out: {
			pre: function(arg) {
				return 'int ' + arg.name + '[' + arg.size + '];';
			},
			post: function(arg) {
				return (
					'duk_push_array(ctx);\n' +
					'for (int i=0; i<' + arg.size + '; i++) {\n' +
					'	duk_push_int(ctx, ' + arg.name + '[i]);\n' +
					'	duk_put_prop_index(ctx, -2, i);\n' +
					'}'
				);
			}
		}
	},
	'nfds_t': defNumber('nfds_t'),
	'pid_t': defNumber('pid_t'),
	'size_t': defNumber('size_t'),
	'ssize_t': defNumber('ssize_t'),
	'struct pollfd*': defStructArray(
		'pollfd', 
		{
			'fd': 'int',
			'events': 'short int',
			'revents': 'short int',
		}
	),
	'unsigned': defNumber('unsigned'),
	'void*': defBuffer('void*'),
};

