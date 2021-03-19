const kern = {};

/** Low level print function */
kern.printk = j.printk;

/** Array of dirs to search for modules */
kern.search_path = [];

/** Joshi interpreter version number */
kern.version = j.version;

return kern;
