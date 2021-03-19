function init(global, j, filepath) {
	const modules_cache = {};
	var kern = undefined;

	// Create anchored require() function
	function create_require(owner_path) {
		const normalize = function(path) {
			const nparts = [];
			
			path
				.split('/')
				.filter(function(part) {return part !== '.'})
				.forEach(function(part) {
					if (part === '..') {
						parts.pop();
					}
					else {
						nparts.push(part);
					}
				});

			return nparts.join('/');
		}

		const anchored_resolve = function(module) {
			const i = owner_path.lastIndexOf('/');
			const owner_dir = owner_path.substr(0, i+1);

			if (!module.endsWith('.js')) {
				module += '/index.js';
			}

			if (module[0] === '.') {
				return normalize(owner_dir + module);
			} 

			if(module[0] === '/') {
				return normalize(module);
			}

			if (!kern || !kern.search_path.length) {
				return normalize(j.dir + '/' + module);
			}

			const dirs = [j.dir].concat(kern.search_path);
			var foundModule;

			for (var i = 0; i < dirs.length; i++) {
				try {
					const candidate = dirs[i] + '/' + module;

					return j.realpath(candidate);
				} 
				catch(err) {
					// ignore
				}
			}

			return normalize(j.dir + '/' + module);
		}

		const anchored_require = function(module) {
			const filepath = anchored_resolve(module);

			if (modules_cache[filepath]) {
				return modules_cache[filepath];
			}

			try {
				const is_core_module = filepath.startsWith(j.dir);
				const args = is_core_module ? "require, j" : "require";

				const source =
					"function("+args+"){ " +
					j.read_file(filepath) +
					" ;}";

				var fn = j.compile_function(source, filepath);

				modules_cache[filepath] = 
					is_core_module 
					? fn(create_require(filepath), j) 
					: fn(create_require(filepath));

				return modules_cache[filepath];
			} 
			catch(err) {
				const msg = err.message || '';

				if (msg.startsWith('Cannot read file: ')) {
					err = new Error('Module not found: ' + module);
					err.errno = 2; // ENOENT
				}
				else {
					err.message += ' (in require of ' + module + ')';
				}

				throw err;
			}
		}

		anchored_require.owner_path = owner_path;
		anchored_require.resolve = anchored_resolve;

		return anchored_require;
	}

	// Resolve filepath
	const main_path = j.realpath(filepath);

	// Read and compile main
	var main_lines = j.read_file(main_path).split('\n');

	if (main_lines[0].startsWith('#!')) {
		main_lines[0] = '//' + main_lines[0];
	}
		
	const main_source =
		"function(argv, require){ " +
		main_lines.join('\n') +
		" ;}";

	var main;

	try {
		main = j.compile_function(main_source, main_path);
	} catch(err) {
		j.printk('Compilation error: ' + err + '\n  at file' + main_path + '\n');
		return -1;
	}

	// Invoke main
	try {
		const argv = [];

		for(var i=3; i<arguments.length; i++) {
			argv[i-3] = arguments[i];
		}

		const require = create_require(main_path);

		require('shims');
		kern = require('kern');
		
		const retval = main(argv, require);

		if (retval === false) {
			return 1;
		}

		if (typeof retval === 'number') {
			return retval;
		}
	} catch(err) {
		j.printk('Unhandled error: ' + err.stack + '\n');
		return -1;
	}

	return 0;
}
