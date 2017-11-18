/**
 * Created by colby on 11/16/2017.
 */
var uuid = require('uuid/v4');

var QuestionPack = function (content, manifest) {
	this.questions = content.content;
	this.episodeId = content.episodeid;
	this.manifest = manifest;

	for (var i = 0; i < this.questions.length; i++) {
		this.questions[i].uuid = uuid();
	}
};

QuestionPack.prototype.validate = function () {
	return !!this.questions && this.questions.length !== 0;
};

QuestionPack.prototype.save = function () {
	// TODO
};

QuestionPack.prototype.delete = function () {
	// TODO
};

module.exports = QuestionPack;
