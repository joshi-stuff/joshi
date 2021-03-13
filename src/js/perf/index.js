const term = require('term');

const println = term.println;

const perf = {};

function PerfData(label) {
	this.labels = [label];
	this.samples = [performance.now()];
}

PerfData.prototype = {

	lap: function(label) {
		this.labels.push(label);
		this.samples.push(performance.now());
	},

	end: function() {
		this.labels.push('end');
		this.samples.push(performance.now());
		return this;
	},

	report: function() {
		println('PERFORMANCE REPORT:', this.labels[0]);

		for (var i = 1; i < this.samples.length; i++) {
			println(
				'   ', this.labels[i], 
				(this.samples[i]-this.samples[i-1]).toFixed(),
				'ms'
			);
		}
	},
}

perf.start = function(label) {
	return new PerfData(label);
}

return perf;
