const util = {};

util.prefix_var_name = function(prefix, v) {
	const nv = Object.assign({}, v);

	nv.name = prefix + v.name;

	return nv;
}

return util;
