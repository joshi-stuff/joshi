const io = require('io');

const proc = {};

/**
 * Creates two pipes and wires them so that parent and child can talk to each 
 * other.
 *
 * @param [{}|undefined] wire
 * An object with `child` and `parent` properties and `in` and `out` and `err`
 * subproperties that specifies standard inputs and outputs to be wired to the 
 * pipe.
 *
 * Note that any wired standard fd is lost.
 *
 * @return [{pid: number, in: number, out: number, child|parent: true}]
 * An object where `in` and `out` are the corresponding pipe fds (for child and 
 * parent).
 */
proc.pipe_fork = function(wire) {
	wire = wire || {};
	wire.parent = wire.parent || {};
	wire.child = wire.child || {};

	const p2c = io.pipe().fildes;
	const c2p = io.pipe().fildes;

	const pid = proc.fork();
	var read_fd;
	var write_fd;

	if (pid !== 0) {
		io.close(p2c[0]);
		io.close(c2p[1]);

		read_fd = c2p[0];
		write_fd = p2c[1];

		wire = wire.parent;
	} else {
		io.close(p2c[1]);
		io.close(c2p[0]);

		read_fd = p2c[0];
		write_fd = c2p[1];

		wire = wire.child;
	}

	if (wire.in) {
		io.dup2(read_fd, 0);
	}

	if (wire.out) {
		io.dup2(write_fd, 1);
	}

	if (wire.err) {
		io.dup2(write_fd, 2);
	}

	return  {
		pid,
		in: read_fd,
		out: write_fd,
		child: pid ===0,
		parent: pid !== 0
	};
}

proc.fork = function() {
	return j.fork();
}

return proc;
