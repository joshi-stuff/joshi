// TODO: initialize console with a core module (using write() builtin)

function init(global, j, filepath) {
	const modules_cache = {};

	// Create anchored require() function
	function createRequire(caller) {
		const anchoredResolve = function(module) {
			const i = caller.lastIndexOf('/');
			const callerDir = caller.substr(0, i+1);

			if (module[0] === '.') {
				return j.realpath(callerDir + module);
			}

			if (module.indexOf('/') == -1) {
				module += '/index.js';
			}

			return j.dir + '/' + module;
		}

		const anchoredRequire = function(module) {
			const filepath = anchoredResolve(module);

			if (modules_cache[filepath]) {
				return modules_cache[filepath];
			}

			const isCoreModule = (module[0] !== '.');

			const args = isCoreModule ? "require, j" : "require";

			const source =
				"function("+args+"){\n" +
				j.read_file(filepath) +
				"\n}";

			var fn = j.compile_function(source, filepath);

			modules_cache[filepath] = isCoreModule ? fn(this, j) : fn(this);

			return modules_cache[filepath];
		}

		anchoredRequire.caller = caller;
		anchoredRequire.resolve = anchoredResolve;

		return anchoredRequire;
	}

	// Resolve filepath
	const mainPath = j.realpath(filepath);

	// Read and compile main
	const mainSource =
		"function(argv, require){\n" +
		j.read_file(mainPath) +
		"\n}";

	var main;

	try {
		main = j.compile_function(mainSource, mainPath);
	} catch(err) {
		console.log(err.toString());
		console.log("  at file", mainPath);

		return -1;
	}

	// Invoke main
	try {
		const argv = [];

		for(var i=3; i<arguments.length; i++) {
			argv[i-3] = arguments[i];
		}
		
		const retval = main(argv, createRequire(mainPath));

		if (retval === false) {
			return 1;
		}

		if (typeof retval === 'number') {
			return retval;
		}
	} catch(err) {
		console.log(err.toString());
		console.log("  at file", mainPath);
		console.log(err.stack);

		return -1;
	}

	return 0;
}
