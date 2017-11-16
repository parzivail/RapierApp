/**
 * Created by colby on 11/16/2017.
 */
var Manifest = function (id, name, types) {
	this.id = id;
	this.name = name;
	this.types = types;
};

Manifest.prototype.validate = function () {
	return !!this.id && !!this.name && !!this.types && this.types.length !== 0 && this.types.indexOf("Question") !== -1;
};

module.exports = Manifest;