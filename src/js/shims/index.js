Array.prototype.find = function(predicate) {
	const i = this.findIndex(predicate);

	return i === -1 ? undefined : this[i];
}

Array.prototype.findIndex = function(predicate) {
	for (var i = 0; i < this.length; i++) {
		if (predicate(this[i])) {
			return i;
		}
	}

	return -1;
}

Array.prototype.flat = function() {
	var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

	return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
		if (Array.isArray(cur)) {
			acc.push.apply(acc, Array.prototype.flat.call(cur, depth - 1));
		} else {
			acc.push(cur);
		}

		return acc;
	}, []) : Array.prototype.slice.call(this);
}

Array.prototype.includes = function(item) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === item) {
			return true;
		}
	}

	return false;
}

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
	const i = this.lastIndexOf(suffix);

	if (i === -1) {
		return false;
	}

	return i === this.length - suffix.length;
}

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}
