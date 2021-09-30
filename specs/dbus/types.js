const ATOMIC = require('types/ATOMIC.js');
const CONSTANT = require('types/CONSTANT.js');
const OPAQUE = require('types/OPAQUE.js');
const STRING_PT = require('types/STRING_PT.js');

return {
	// Atomic types
	'char*': STRING_PT(),
	int: ATOMIC('int'),
	short: ATOMIC('int'),

	// Buffer types
	CONSTANT: CONSTANT(),

	// Opaque types
	'DBusConnection*': OPAQUE(),
	'DBusMessage*': OPAQUE(),

	// Array types

	// Struct types
};
