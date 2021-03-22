const io = require('io');

/**
 * Callback for {EphemeralFd} constructor
 *
 * @callback EphemeralFdCallback
 *
 * @param {number} sourceFd
 * The source file descriptor that is being redirected to/from the EphemeralFd
 * instance.
 *
 * @returns {number} A new file descriptor to pipe to/from
 * @private
 */

/**
 * This class is used to redirect data from/to processes to/from file
 * descriptors than only remain open during the executions of the process.
 *
 * Instances of this class must be fed to {@link module:shell.Proc.pipe}.
 *
 * @param {function} $ A reference to the `shell` module
 *
 * @param {EphemeralFdCallback} openFn
 * A function that is invoked to return the file descriptor when needed.
 *
 * @class
 * @implements {Redirection}
 * @private
 */
function EphemeralFd($, openFn) {
	this.$ = $;
	this.is_a = 'EphemeralFd';

	this._fd = undefined;
	this._open = openFn;
}

EphemeralFd.prototype = {

	/**
	 * Close underlying ephemeral file descriptor
	 *
	 * @returns {void}
	 * @throws {SysError}
	 */
	close: function() {
		if (this._fd) {
			io.close(this._fd);
			this._fd = undefined;
		}
	},

	/**
	 * Open the ephemeral file descriptor for a given source file descriptor.
	 *
	 * @param {number} sourceFd Source file descriptor of capture
	 * @returns {void}
	 * @throws {SysError}
	 */
	open: function(sourceFd) {
		// TODO: EphemeralFd fails with more than one fd (check if it can be
		// fixed and made better: for example open several fds)
		if (this._fd) {
			throw new Error('EphemeralFd is already open');
		}

		this._fd = this._open(sourceFd);

		return this._fd;
	},

}

return EphemeralFd;
