function init(global, j, filepath) {
	const modules_cache = {};

	// Create anchored require() function
	function createRequire(ownerPath) {
		const anchoredResolve = function(module) {
			const i = ownerPath.lastIndexOf('/');
			const ownerDir = ownerPath.substr(0, i+1);

			if (module[0] === '.') {
				module = j.realpath(ownerDir + module);
			} 
			else if(module[0] === '/') {
				// absolute path: do nothing
			}
			else {
				module = j.dir + '/' + module;
			}
			
			if (!module.endsWith('.js')) {
				module += '/index.js';
			}

			return module;
		}

		const anchoredRequire = function(module) {
			const filepath = anchoredResolve(module);

			if (modules_cache[filepath]) {
				return modules_cache[filepath];
			}

			try {
				const isCoreModule = (module[0] !== '.');

				const args = isCoreModule ? "require, j" : "require";

				const source =
					"function("+args+"){ " +
					j.read_file(filepath) +
					" ;}";

				var fn = j.compile_function(source, filepath);

				modules_cache[filepath] = 
					isCoreModule 
					? fn(createRequire(filepath), j) 
					: fn(createRequire(filepath));

				return modules_cache[filepath];
			} 
			catch(err) {
				const msg = err.message || '';

				if (msg.startsWith('Cannot read file: ')) {
					err = new Error('Module not found: ' + module);
					err.errno = 2; // ENOENT
				}

				throw err;
			}
		}

		anchoredRequire.ownerPath = ownerPath;
		anchoredRequire.resolve = anchoredResolve;

		return anchoredRequire;
	}

	// Resolve filepath
	const mainPath = j.realpath(filepath);

	// Read and compile main
	var mainLines = j.read_file(mainPath).split('\n');

	if (mainLines[0].startsWith('#!')) {
		mainLines[0] = '//' + mainLines[0];
	}
		
	const mainSource =
		"function(argv, require){ " +
		mainLines.join('\n') +
		" ;}";

	var main;

	try {
		main = j.compile_function(mainSource, mainPath);
	} catch(err) {
		j.printk('Compilation error: ' + err + '\n  at file' + mainPath + '\n');
		return -1;
	}

	// Invoke main
	try {
		const argv = [];

		for(var i=3; i<arguments.length; i++) {
			argv[i-3] = arguments[i];
		}

		const require = createRequire(mainPath);

		require('shims');
		
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
