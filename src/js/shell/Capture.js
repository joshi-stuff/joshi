const fs = require('fs');
const io = require('io');
const math = require('math');
const proc = require('proc');

const println2 = require('term').println2;

function Capture($, container) {
	this.$ = $;
	this.is_a = 'Capture';
	this.container = container;
	this.fd = undefined;
	this.name = undefined;
}

Capture.NAMES = {
	0: 'in',
	1: 'out',
	2: 'err'
};

Capture.prototype = {

	close: function() {
		try {
			io.lseek(this.fd, 0, io.SEEK_SET);
			const content = io.read_file(this.fd);

			this.container[this.name] = content;
		} 
		finally {
			io.close(this.fd);
			this.fd = undefined;
		}
	},

	open: function(sourceFd) {
		this.name = Capture.NAMES[sourceFd] || ('fd' + sourceFd);

		const rnd = math.get_random_bytes(2);
		const filename = '/tmp/joshi_' + proc.getpid() + '_' + rnd[0] + rnd[1];

		this.fd = io.create(filename);
		fs.unlink(filename);

		return this.fd;
	},

}

return Capture;


