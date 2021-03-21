/**
 * @exports perf
 */
const perf = {};

/**
 * @class
 * @hideconstructor
 */
function PerfData(label) {
	this.labels = [label];
	this.samples = [performance.now()];
}

PerfData.prototype = {

	/**
	 * Take an intermediate measure of elapsed time
	 *
	 * @param {string} label A label describing the measure
	 * @returns {void}
	 */
	lap: function(label) {
		this.labels.push(label);
		this.samples.push(performance.now());
	},

	/**
	 * Finish taking measures
	 *
	 * @returns {PerfData} The same object for which it has been called
	 */
	end: function() {
		this.labels.push('end');
		this.samples.push(performance.now());
		return this;
	},

	/**
	 * Return the report of taken measures
	 *
	 * @returns {string} 
	 * A human readable string containing the elapsed and total times described
	 * by their labels.
	 */
	report: function() {
		var str = 'PERFORMANCE REPORT: ' + this.labels[0];

		for (var i = 1; i < this.samples.length; i++) {
			str += '\n    ';
			str += this.labels[i] + ' ';
			str += (this.samples[i]-this.samples[i-1]).toFixed();
			str += ' ms';
		}

		return str;
	},
}

/**
 * Start a performance data collection with a resolution of milliseconds.
 *
 * @param {string} label The name of the data collection
 * @returns {PerfData} An object with methods to perform the collection
 */
perf.start = function(label) {
	return new PerfData(label);
}

return perf;
