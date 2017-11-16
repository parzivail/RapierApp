/**
 * Created by colby on 11/16/2017.
 */
var QuestionPack = function (content, manifest) {
	this.questions = content.content;
	this.manifest = manifest;
};

QuestionPack.prototype.validate = function () {
	return !!this.questions && this.questions.length !== 0;
};

module.exports = QuestionPack;