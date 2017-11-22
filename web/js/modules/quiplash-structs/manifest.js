/**
 * Created by colby on 11/16/2017.
 */
var Manifest = function (id, name, types, metadata, path) {
	const defaultMetadata = {
		author: "Anonymous",
		url: "",
		description: "Quiplash DLC",
		madeby: "Rapier"
	};

	if (!metadata)
		metadata = {
			hasMetadata: false
		};
	else
		metadata.hasMetadata = true;

	this.id = id;
	this.name = name;
	this.types = types;
	this.metadata = Object.assign(defaultMetadata, metadata);
	this.path = path;
};

Manifest.prototype.validate = function () {
	return !!this.id && !!this.name && !!this.types && this.types.length !== 0 && this.types.indexOf("Question") !== -1;
};

module.exports = Manifest;