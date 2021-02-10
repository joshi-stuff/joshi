// TODO: track caller filename to resolve paths correctly
// TODO: handle builtin packages (those not starting with .)
// TODO: point CORE_DIR to /usr/lib/joshi
// TODO: initialize global object (console)

function init(global, j, filepath) {
	const CORE_DIR = "/home/ivan/Desarrollo/joshi";
	const modules_cache = {};

	// Create anchored require() function
	function createRequire(caller) {
		const anchoredResolve = function(module) {
			const i = caller.lastIndexOf('/');
			const callerDir = caller.substr(0, i+1);

			if (module[0] === '.') {
				return j.resolve_path(callerDir + module);
			}

			if (module.indexOf('/') == -1) {
				module += '/index.js';
			}

			return CORE_DIR + '/' + module;
		}

		const anchoredRequire = function(module) {
			const filepath = anchoredResolve(module);

			if (modules_cache[filepath]) {
				return modules_cache[filepath];
			}

			const source =
				"function(require){\n" +
				j.read_file(filepath) +
				"\n}";

			var fn = j.compile_function(source, filepath);

			modules_cache[filepath] = fn(this);

			return modules_cache[filepath];
		}

		anchoredRequire.caller = caller;
		anchoredRequire.resolve = anchoredResolve;

		return anchoredRequire;
	}

	// Resolve filepath
	const mainPath = j.resolve_path(filepath);

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
