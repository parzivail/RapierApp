/**
 * Created by colby on 11/15/2017.
 */
module.exports = {
	id: function (needle) {
		return document.getElementById(needle);
	},
	class: function (needle) {
		return document.getElementsByClassName(needle);
	},
	name: function (needle) {
		return document.getElementsByName(needle);
	}
};