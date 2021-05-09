const fs = require('fs');
const io = require('io');

/**
 * This class is used to capture output from processes in an object variable.
 *
 * Instances of this class must be fed to {@link module:shell.Proc.pipe}.
 *
 * @param {function} $ A reference to the `shell` module
 * @param {object} container An empty object to hold the captured data
 * @class
 * @implements {Redirection}
 * @private
 */
function Capture($, container) {
	this.$ = $;
	this.is_a = 'Capture';
	this.container = container;
	this.sources = [];
}

/**
 * Symbolic names for specific file descriptors. They are used in place of the 
 * file descriptor number to store data under keys in the capture's container
 * object.
 */
Capture.NAMES = {
	0: 'in',
	1: 'out',
	2: 'err'
};

Capture.prototype = {

	/**
	 * Close a capture saving all data to the container object.
	 *
	 * @returns {void}
	 * @throws {SysError}
	 */
	close: function() {
		const container = this.container;

		this.sources.forEach(function(source) {
			try {
				io.seek(source.fd, 0, io.SEEK_SET);
				container[source.name] = io.read_string(source.fd);
			} 
			finally {
				io.close(source.fd, false);
			}
		});

		this.sources = [];
	},

	/**
	 * Open a capture for a given source file descriptor.
	 *
	 * If the file descriptor is one of the listed in {@link Capture.NAMES} its
	 * symbolic name is used to store the data inside the container variable.
	 *
	 * @param {number} sourceFd Source file descriptor of capture
	 * @returns {void}
	 * @throws {SysError}
	 */
	open: function(sourceFd) {
		const source = {
			name: Capture.NAMES[sourceFd] || ('fd' + sourceFd),
		};

		const filename = fs.create_temp_file('');
		source.fd = io.create(filename);
		fs.unlink(filename);

		this.sources.push(source);

		return source.fd;
	},

}

return Capture;
