const fs = require('fs');
const io = require('io');
const math = require('math');
const proc = require('proc');

function Capture($, container) {
	this.$ = $;
	this.is_a = 'Capture';
	this.container = container;
	this.sources = [];
}

Capture.NAMES = {
	0: 'in',
	1: 'out',
	2: 'err'
};

Capture.prototype = {

	close: function() {
		const container = this.container;

		this.sources.forEach(function(source) {
			try {
				io.lseek(source.fd, 0, io.SEEK_SET);
				container[source.name] = io.read_file(source.fd);
			} 
			finally {
				io.safe_close(source.fd);
			}
		});

		this.sources = [];
	},

	open: function(sourceFd) {
		const source = {
			name: Capture.NAMES[sourceFd] || ('fd' + sourceFd),
		};

		const rnd = math.get_random_bytes(2);
		const filename = 
			'/tmp/joshi_' + proc.getpid() + '_' + sourceFd + '_'
				+ rnd[0] + rnd[1];

		source.fd = io.create(filename);
		fs.unlink(filename);

		this.sources.push(source);

		return source.fd;
	},

}

return Capture;


