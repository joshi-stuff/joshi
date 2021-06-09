Array.prototype.find = function (predicate) {
	const i = this.findIndex(predicate);

	return i === -1 ? undefined : this[i];
};

Array.prototype.findIndex = function (predicate) {
	for (var i = 0; i < this.length; i++) {
		if (predicate(this[i])) {
			return i;
		}
	}

	return -1;
};

Array.prototype.flat = function () {
	var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

	return depth
		? Array.prototype.reduce.call(
				this,
				function (acc, cur) {
					if (Array.isArray(cur)) {
						acc.push.apply(
							acc,
							Array.prototype.flat.call(cur, depth - 1)
						);
					} else {
						acc.push(cur);
					}

					return acc;
				},
				[]
		  )
		: Array.prototype.slice.call(this);
};

Array.prototype.includes = function (item) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === item) {
			return true;
		}
	}

	return false;
};

Array.prototype.reduce = function (callback, init_val) {
	var first_index = 0;

	if (init_val === undefined) {
		init_val = this[0];
		first_index = 1;
	}

	for (var i = first_index; i < this.length; i++) {
		init_val = callback(init_val, this[i], i, this);
	}

	return init_val;
};

Object.entries = function (obj) {
	const entries = [];

	const keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		const key = keys[i];

		entries.push([key, obj[key]]);
	}

	return entries;
};

Object.values = function (obj) {
	const values = [];

	const keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		const key = keys[i];

		values.push(obj[key]);
	}

	return values;
};

String.prototype.endsWith = function (suffix) {
	const i = this.lastIndexOf(suffix);

	if (i === -1) {
		return false;
	}

	return i === this.length - suffix.length;
};

String.prototype.startsWith = function (prefix) {
	return this.indexOf(prefix) === 0;
};

String.prototype.trimLeft = String.prototype.trimStart = function () {
	return this.replace(
		/^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]*/,
		''
	);
};

String.prototype.trimRight = String.prototype.trimEnd = function () {
	return this.replace(
		/[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]*$/,
		''
	);
};
