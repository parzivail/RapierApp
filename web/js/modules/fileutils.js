/**
 * Created by colby on 11/15/2017.
 */
const path = require('path'),
	fs = require('fs');

module.exports = {
	isValidQuiplash: function (file) {
		var dir = path.dirname(file);
		dir = path.join(dir, 'content', 'manifest.jet');
		return fs.existsSync(dir);
	},
};