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
	var newManifest = {
		id: "Pack1",
		name: "DLC Pack 1",
		types: ["Question"]
	};

	var newContent = {
		episodeId: this.episodeId,
		content: [
			{
				x: false,
				id: 12345,
				prompt: "Question thing"
			}
		]
	};

	var dataJet = {
		fields: [{
			t: "B",
			v: true,
			n: "HasJokeAudio"
		}, {
			t: "S",
			v: "dinosaur|a dinosaur", // keywords.join('|')
			n: "Keywords"
		}, {
			t: "S",
			v: "",
			n: "Author"
		}, {
			t: "S",
			v: "A dinosaur? Get Jeff Goldblum to Scotland, STAT!",
			n: "KeywordResponseText"
		}, {
			t: "S",
			v: "What is the Loch Ness Monster, really?",
			n: "PromptText"
		}, {
			t: "S",
			v: "",
			n: "Location"
		}, {
			t: "A",
			v: "joke", // joke.mp3
			n: "KeywordResponseAudio"
		}, {
			t: "A",
			v: "vo", // vo.mp3
			n: "PromptAudio"
		}]
	};

	/*
	 create folder {name = "Question"}
	 foreach question
	 if !exists (folder {name = question.id})
	 create folder {name = question.id}
	 populate folder
	 vo.mp3
	 joke.mp3
	 write out data.jet
	 */
};

QuestionPack.prototype.delete = function () {
	// TODO
};

module.exports = QuestionPack;
