/**
 * Created by colby on 11/15/2017.
 */
const path = require('path'),
	fs = require('fs');

module.exports = {
	isValidQuiplash: function (file) {
		var dir = path.dirname(file);
		return fs.existsSync(path.join(dir, 'content', 'manifest.jet')) ? dir : false;
	},
};