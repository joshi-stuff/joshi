const jd = require('joshi_dbus.so');
const term = require('term');

const println = term.println;

/**
 * @typedef {object} DBusConnection
 * @property {string} is_a Always contains 'DBusConnection'
 * @property {Uint8Array} handle Opaque handle to connection
 */

var debug = false;
var timeout = 60000;

/**
 * @enum {number}
 * @exports dbus
 * @readonly
 */
const dbus = {
	/** Session bus */
	BUS_SESSION: 0,

	/** System bus */
	BUS_SYSTEM: 1,

	/** The bus that started the current process */
	BUS_STARTER: 2,
};

/**
 * Marshall array typed data for D-Bus messaging.
 *
 * @param {function} VALUE_TYPE
 * A D-Bus marshaller function specifying the array items type.
 *
 * @param {Array} items
 * Array of primitive values that will be marshalled with VALUE_TYPE function
 * inside the D-Bus message.
 *
 * @returns {object} The marshalled data
 */
dbus.ARRAY = function DICT(VALUE_TYPE, items) {
	items = items.map(function (item) {
		return VALUE_TYPE(item);
	});

	return {
		type: 'ARRAY',
		item_type: VALUE_TYPE.name,
		items: items,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {boolean} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.BOOLEAN = function BOOLEAN(value) {
	return {
		type: 'BOOLEAN',
		value: !!value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.BYTE = function BYTE(value) {
	return {
		type: 'BYTE',
		value: value,
	};
};

/**
 * Marshall dictionary typed data for D-Bus messaging.
 *
 * @param {function} KEY_TYPE
 * A D-Bus marshaller function specifying the type for keys.
 *
 * @param {function} VALUE_TYPE
 * A D-Bus marshaller function specifying the type for values
 *
 * @param {Array} entries
 * Even sized array of primitive values that will be marshalled consecutively
 * with KEY_TYPE and VALUE_TYPE functions inside the D-Bus message.
 *
 * @returns {object} The marshalled data
 */
dbus.DICT = function DICT(KEY_TYPE, VALUE_TYPE, entries) {
	if (entries.length % 2 !== 0) {
		throw new Error('Entries array length must be even');
	}

	const items = [];

	for (var i = 0; i < entries.length; i += 2) {
		items.push({
			type: 'DICT_ENTRY<' + KEY_TYPE.name + ',' + VALUE_TYPE.name + '>',
			key: KEY_TYPE(entries[i]),
			value: VALUE_TYPE(entries[i + 1]),
		});
	}

	return {
		type: 'ARRAY',
		item_type: 'DICT_ENTRY<' + KEY_TYPE.name + ',' + VALUE_TYPE.name + '>',
		items: items,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.DOUBLE = function DOUBLE(value) {
	return {
		type: 'DOUBLE',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.INT16 = function INT16(value) {
	return {
		type: 'INT16',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.INT32 = function INT32(value) {
	return {
		type: 'INT32',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.INT64 = function INT64(value) {
	return {
		type: 'INT64',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {string} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.OBJECT_PATH = function OBJECT_PATH(value) {
	return {
		type: 'OBJECT_PATH',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {string} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.SIGNATURE = function SIGNATURE(value) {
	return {
		type: 'SIGNATURE',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {string} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.STRING = function STRING(value) {
	return {
		type: 'STRING',
		value: value,
	};
};

/**
 * Marshall struct typed data for D-Bus messaging.
 *
 * @param {Array} values
 * Array of marshalled values that will be put inside the D-Bus message.
 *
 * @returns {object} The marshalled data
 */
dbus.STRUCT = function STRUCT(values) {
	if (!Array.isArray(values)) {
		throw new Error('Values must be an array of D-Bus typed values');
	}

	var type = 'STRUCT<';

	values.forEach(function (value, i) {
		if (i > 0) {
			type += ',';
		}

		type += value.type;
	});

	type += '>';

	return {
		type: type,
		values: values,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.UINT16 = function UINT16(value) {
	return {
		type: 'UINT16',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.UINT32 = function UINT32(value) {
	return {
		type: 'UINT32',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.UINT64 = function UINT64(value) {
	return {
		type: 'UINT64',
		value: value,
	};
};

/**
 * Marshall primitive JavaScript value for D-Bus messaging.
 *
 * @param {number} value The primitive value to marshall.
 * @returns {object} The marshalled data
 */
dbus.UNIX_FD = function UNIX_FD(value) {
	return {
		type: 'UNIX_FD',
		value: value,
	};
};

/**
 * Marshall marshalled data inside a variant for D-Bus messaging.
 *
 * @param {object} value
 * An already marshalled D-Bus message data.
 *
 * @returns {object} The marshalled data
 */
dbus.VARIANT = function VARIANT(value) {
	return {
		type: 'VARIANT',
		value: value,
	};
};

/**
 * Invoke a D-Bus method.
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @param {string} destination Destination process
 * @param {string} path Object path
 * @param {string} iface Object interface
 * @param {string} method Method to invoke
 * @param {...*} args Method arguments
 * @returns {object} A JavaScript object with the reply
 * @see {module:dbus.open}
 */
dbus.call = function (conn, destination, path, iface, method) {
	const args = Array.prototype.slice.call(arguments, 5);

	if (debug) {
		println('====');
		println('Message to:', destination, path);
		println('Method:', iface, method);
		println('Payload:');
		println(JSON.stringify(args, null, 2));
		println('====');
	}

	const result = jd.call(
		timeout,
		conn.handle,
		destination,
		path,
		iface,
		method,
		args
	);

	result = unmarshall(result);

	if (debug) {
		println('Reply:');
		println(JSON.stringify(result, null, 2));
		println('====');
	}

	return Array.isArray(result) && result.length === 1 ? result[0] : result;
};

/**
 * Close connection
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @returns {void}
 */
dbus.close = function (conn) {
	jd.close(conn.handle);
};

/**
 * Get children nodes of a D-Bus object
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @param {string} destination Destination process
 * @param {string} path Object path
 * @returns {string[]}
 */
dbus.get_children = function (conn, destination, path) {
	const xml = dbus.call(
		conn,
		destination,
		path,
		'org.freedesktop.DBus.Introspectable',
		'Introspect'
	);

	const regexp = new RegExp('<node name="([^"]+)"/>', 'g');
	const nodes = [];
	var node;

	while ((node = regexp.exec(xml))) {
		nodes.push(node[1]);
	}

	return nodes;
};

/**
 * Get properties of a D-Bus object
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @param {string} destination Destination process
 * @param {string} path Object path
 * @param {string} iface Object interface
 * @returns {object<string, *>}
 */
dbus.get_properties = function (conn, destination, path, iface) {
	if (
		!dbus.implements(
			conn,
			destination,
			path,
			'org.freedesktop.DBus.Properties'
		)
	) {
		throw new Error(
			'Object ' +
				destination +
				' at ' +
				path +
				' does not support properties'
		);
	}

	return dbus.call(
		conn,
		destination,
		path,
		'org.freedesktop.DBus.Properties',
		'GetAll',
		dbus.STRING(iface)
	);
};

/**
 * Test if a D-Bus object implements an interface
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @param {string} destination Destination process
 * @param {string} path Object path
 * @param {string} iface Object interface
 * @returns {boolean}
 */
dbus.implements = function (conn, destination, path, iface) {
	const xml = dbus.call(
		conn,
		destination,
		path,
		'org.freedesktop.DBus.Introspectable',
		'Introspect'
	);

	const regexp = new RegExp('<interface name="' + iface + '">');

	return !!regexp.exec(xml);
};

/**
 * Open a connection to a well known bus
 *
 * @param {number} type
 * A well known bus identifier ({@link module:dbus.BUS_SESSION},
 * {@link module:dbus.BUS_SYSTEM}, {@link module:dbus.BUS_STARTER}).
 *
 * @returns {DBusConnection} The D-Bus connection
 */
dbus.open = function (type) {
	const handle = jd.open(type);

	return {
		is_a: 'DBusConnection',
		handle: handle,
	};
};

/**
 * Set debug flag that causes in and out messages to be dumped to the console.
 *
 * @param {boolean} debug Whether to dump D-Bus messages
 * @returns {void}
 */
dbus.set_debug = function (_debug) {
	debug = _debug;
};

/**
 * Set a D-Bus object property
 *
 * @param {DBusConnection} conn The D-Bus connection
 * @param {string} destination Destination process
 * @param {string} path Object path
 * @param {string} iface Object interface
 * @param {string} property Property name
 * @param {object} value A marshalled D-Bus message value
 * @returns {void}
 */
dbus.set_property = function (conn, destination, path, iface, property, value) {
	if (
		!dbus.implements(
			conn,
			destination,
			path,
			'org.freedesktop.DBus.Properties'
		)
	) {
		throw new Error(
			'Object ' +
				destination +
				' at ' +
				path +
				' does not support properties'
		);
	}

	return dbus.call(
		conn,
		destination,
		path,
		'org.freedesktop.DBus.Properties',
		'Set',
		dbus.STRING(iface),
		dbus.STRING(property),
		dbus.VARIANT(value)
	);
};

/**
 * Set {@link module:dbus.call} timeout.
 *
 * @param {number} timeout Timeout in milliseconds
 * @returns {void}
 */
dbus.set_timeout = function (_timeout) {
	timeout = _timeout;
};

/**
 * Check if an object is a DICT_ENTRY
 *
 * @param {object} obj The object to test
 * @returns {boolean}
 */
function is_dict_entry(obj) {
	const keys = Object.keys(obj);

	if (keys.length !== 3) {
		return false;
	}

	if (!obj.is_a) {
		return false;
	}

	if (obj.is_a !== 'DICT_ENTRY') {
		return false;
	}

	if (obj.key === undefined) {
		return false;
	}

	if (obj.value === undefined) {
		return false;
	}

	return true;
}

/**
 * Unmarshall a D-Bus object to convert arrays of DICT_ENTRY objects into native
 * JavaScript objects.
 *
 * @param {object} obj A D-Bus return message
 * @returns {object} The unmarshalled D-Bus message
 */
function unmarshall(obj) {
	if (Array.isArray(obj) && obj.length && is_dict_entry(obj[0])) {
		return obj.reduce(function (unobj, key_val) {
			unobj[key_val.key] = key_val.value;
			return unobj;
		}, {});
	} else if (Array.isArray(obj)) {
		return obj.map(function (item) {
			return unmarshall(item);
		});
	} else {
		return obj;
	}
}

return dbus;
