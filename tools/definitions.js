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
	//'struct pollfd*': {
	//	gen: gen.getBufferData('struct pollfd*')
	//},
	'unsigned': defNumber('unsigned'),
	'void*': defBuffer('void*'),
};

