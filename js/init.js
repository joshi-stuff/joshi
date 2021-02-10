function main(global, j, filepath) {
	const exports = {};

	// TODO: track caller filename to resolve paths correctly
	// TODO: handle builtin packages (those not starting with .)
	function require(filepath) {
		if (exports[filepath]) {
			return exports[filepath];
		}

		var contents = j.read_file(filepath);

		contents =
			"function(require){\n" +
			contents +
			"\n}";

		var fn = j.compile_function(contents, filepath);

		exports[filepath] = fn(require);

		return exports[filepath];
	}

	// TODO: initialize global object (console)

	var contents = j.read_file(filepath);

	contents =
		"function(argv, require){\n" +
		contents +
		"\n}";

	var main;

	try {
		main = j.compile_function(contents, filepath);
	} catch(err) {
		console.log(err.toString());
		console.log("  at file", filepath);
		
		const lines = contents.split("\n");
		
		console.log("  ---------");
		for(var i=0; i<lines.length; i++) {
			console.log("  "+i+":", lines[i]);
		}
		console.log("  ---------");

		return -1;
	}

	const argv = [];

	for(var i=3; i<arguments.length; i++) {
		argv[i-3] = arguments[i];
	}

	var retval;

	try {
		retval = main(argv, require);
	} catch(err) {
		console.log(err.toString());
		console.log("  at file", filepath);
		console.log(err.stack);

		return -1;
	}

	if (retval === false) {
		return 1;
	}

	if (typeof retval === 'number') {
		return retval;
	}

	return 0;
}
