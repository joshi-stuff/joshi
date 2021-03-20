const fs = require('fs');
const io = require('io');

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
				io.seek(source.fd, 0, io.SEEK_SET);
				container[source.name] = io.read_string(source.fd);
			} 
			finally {
				io.close(source.fd, false);
			}
		});

		this.sources = [];
	},

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


