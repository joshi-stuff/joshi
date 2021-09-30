const CUSTOMIZED = function (argc) {
	const args = [];

	for (var i = 0; i < argc; i++) {
		args.push({ type: 'int', name: 'arg' + i });
	}

	return {
		args: args,
		returns: { type: 'int' },
		throws: 'nothing',
	};
};

return {
	call: CUSTOMIZED(7),
	close: CUSTOMIZED(1),
	open: CUSTOMIZED(1),
};
