/**
 * Created by colby on 11/16/2017.
 */
var QuestionPack = function (content, manifest) {
	this.questions = content.content;
	this.episodeId = content.episodeid;
	this.manifest = manifest;

	for (var i = 0; i < this.questions.length; i++) {
		this.questions[i].uuid = 0;
	}
};

QuestionPack.prototype.validate = function () {
	return !!this.questions && this.questions.length !== 0;
};

module.exports = QuestionPack;