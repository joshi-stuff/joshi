/** 
 * @exports kern
 */
const kern = {};

/** 
 * Low level print function: prints the message to stderr without trailing '\n'. 
 *
 * This function shouldn't be used unless from very low level modules where `io`
 * or `term` packages are not accessible.
 *
 * @param {string} message
 * @return {void}
 * @see {module:io#write_str}
 * @see {module:term#print2}
 */
kern.printk = j.printk;

/** 
 * Array of dirs to search for modules
 *
 * @type {string[]}
 */
kern.search_path = [];

/** 
 * Joshi interpreter version number: a string with three number separated by 
 * periods (example: `1.0.2`)
 *
 * @type {string}
 */
kern.version = j.version;

return kern;
