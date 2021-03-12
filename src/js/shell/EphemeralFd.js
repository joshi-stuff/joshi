const io = require('io');

function EphemeralFd($, openFn) {
	this.$ = $;
	this.is_a = 'EphemeralFd';

	this._fd = undefined;
	this._open = openFn;
}

EphemeralFd.prototype = {

	open: function(sourceFd) {
		if (this._fd) {
			throw new Error('EphemeralFd is already open');
		}

		this._fd = this._open(sourceFd);

		return this._fd;
	},

	close: function() {
		if (this._fd) {
			io.close(this._fd);
			this._fd = undefined;
		}
	},

}

return EphemeralFd;
