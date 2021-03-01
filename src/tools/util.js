const util = {};

util.prefixVarName = function(prefix, v) {
	const nv = Object.assign({}, v);

	nv.name = prefix + v.name;

	return nv;
}

return util;
