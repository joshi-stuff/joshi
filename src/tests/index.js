const test = require('./test.js');

test.start();

require('./errno.js');
require('./kern.js');
require('./crypto.js');
require('./perf.js');
require('./io.js');
require('./stream.js');
require('./term.js');
require('./fs.js');
require('./proc.js');
require('./shell.js');

test.finish();
