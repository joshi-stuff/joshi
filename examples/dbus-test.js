#!/bin/env joshi

const dbus = require('dbus');
const term = require('term');

const DICT = dbus.DICT;
const VARIANT = dbus.VARIANT;
const BOOLEAN = dbus.BOOLEAN;
const STRING = dbus.STRING;
const println = term.println;

try {
	const system = dbus.open(dbus.BUS_SYSTEM);
	const session = dbus.open(dbus.BUS_SESSION);

	var result;

	dbus.set_debug(false);

	result = dbus.call(
		system,
		'org.freedesktop.network1',
		'/org/freedesktop/network1',
		'org.freedesktop.network1.Manager',
		'Describe'
	);

	println(JSON.stringify(JSON.parse(result), null, 2));
	println();

	result = dbus.call(
		system,
		'org.freedesktop.UDisks2',
		'/org/freedesktop/UDisks2/Manager',
		'org.freedesktop.DBus.Properties',
		'GetAll',
		STRING('org.freedesktop.UDisks2.Manager')
	);

	println(JSON.stringify(result, null, 2));
	println();

	result = dbus.call(
		system,
		'org.freedesktop.UDisks2',
		'/org/freedesktop/UDisks2/Manager',
		'org.freedesktop.UDisks2.Manager',
		'GetBlockDevices',
		DICT(STRING, VARIANT, ['auth.no-user-interaction', BOOLEAN(true)])
	);

	println(JSON.stringify(result, null, 2));
	println();

	const result = dbus.call(
		system,
		'org.freedesktop.DBus',
		'/',
		'org.freedesktop.DBus',
		'GetNameOwner',
		STRING('org.freedesktop.DBus')
	);

	println(JSON.stringify(result, null, 2));
	println();

	result = dbus.call(
		session,
		'org.pulseaudio.Server',
		'/org/pulseaudio/server_lookup1',
		'org.freedesktop.DBus.Properties',
		'GetAll',
		STRING('org.pulseaudio.ServerLookup1')
	);

	println(JSON.stringify(result, null, 2));
	println();

	result = dbus.call(
		system,
		'org.freedesktop.UDisks2',
		'/org/freedesktop/UDisks2/Manager',
		'org.freedesktop.UDisks2.Manager',
		'CanResize',
		STRING('ext4')
	);

	println(JSON.stringify(result, null, 2));
	println();

	dbus.close(system);
	dbus.close(session);
} catch (err) {
	println(err.stack);
}

// vi: ft=javascript
