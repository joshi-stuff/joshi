Object.entries = function(obj) {
	const entries = [];

	const keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		const key = keys[i];

		entries.push([key, obj[key]]);
	}

	return entries;
}

Object.values = function(obj) {
	const values = [];

	const keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		const key = keys[i];

		values.push(obj[key]);
	}

	return values;
}

String.prototype.endsWith = function(suffix) {
	return this.lastIndexOf(suffix) === this.length - suffix.length;
}

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}
