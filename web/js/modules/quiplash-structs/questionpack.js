/**
 * Created by colby on 11/16/2017.
 */
var uuid = require('uuid/v4'),
	fs = require('fs'),
	path = require('path');

var QuestionPack = function (content, manifest, contentPath) {
	this.questions = content.content;
	this.episodeId = content.episodeid;
	this.manifest = manifest;
	this.contentPath = contentPath;

	for (var i = 0; i < this.questions.length; i++) {
		this.questions[i].uuid = uuid();

		var dataJetPath = path.join(contentPath, "" + this.questions[i].id, 'data.jet');
		if (!fs.existsSync(dataJetPath))
			console.err("Failed to load JET for", dataJetPath);
		else
			this.questions[i].jet = this.unJet(JSON.parse(
				fs.readFileSync(dataJetPath)
			));
	}
};

QuestionPack.prototype.validate = function () {
	return !!this.questions && this.questions.length !== 0;
};

QuestionPack.prototype.jetValue = function (jetObj) {
	return jetObj.t === "B" ? jetObj.v === "true" : jetObj.v;
};

QuestionPack.prototype.unJet = function (jet) {
	var obj = {};

	for (var i = 0; i < jet.length; i++) {
		if (jet[i].n === "HasJokeAudio")
			obj.hasJokeAudio = this.jetValue(jet[i]);
		else if (jet[i].n === "Keywords")
			obj.keywords = this.jetValue(jet[i]).split('|');
		else if (jet[i].n === "Author")
			obj.author = this.jetValue(jet[i]);
		else if (jet[i].n === "KeywordResponseText")
			obj.keywordResponseText = this.jetValue(jet[i]);
		else if (jet[i].n === "PromptText")
			obj.promptText = this.jetValue(jet[i]);
		else if (jet[i].n === "Location")
			obj.location = this.jetValue(jet[i]);
		else if (jet[i].n === "KeywordResponseAudio")
			obj.keywordResponseAudio = this.jetValue(jet[i]);
		else if (jet[i].n === "PromptAudio")
			obj.promptAudio = this.jetValue(jet[i]);
		else
			console.err("Unsupported JET question manifest key:", jet[i].n);
	}

	return obj;
};

QuestionPack.prototype.save = function () {

	var newManifest = {
		id: this.manifest.id,
		name: this.manifest.name,
		types: ["Question"]
	};

	var newContent = {
		episodeId: this.episodeId,
		content: []
	};

	var questionFolder = path.join(this.contentPath, "Question");
	if (!fs.existsSync(questionFolder))
		fs.mkdir(questionFolder);

	for (var i = 0; i < this.questions.length; i++) {
		// Setup this folder
		var thisFolder = path.join(questionFolder, this.questions[i].id + "");
		if (!fs.existsSync(thisFolder))
			fs.mkdir(thisFolder);

		// Prune anything we don't need to save
		var questionContent = {
			x: this.questions[i].x,
			id: this.questions[i].id,
			prompt: this.questions[i].prompt,
		};
		newContent.content.push(questionContent);

		// Create the JET
		var dataJet = {
			fields: [{
				t: "B",
				v: this.questions[i].jet.hasJokeAudio + "",
				n: "HasJokeAudio"
			}, {
				t: "S",
				v: this.questions[i].jet.keywords.join('|'),
				n: "Keywords"
			}, {
				t: "S",
				v: this.questions[i].jet.author + "",
				n: "Author"
			}, {
				t: "S",
				v: this.questions[i].jet.keywordResponseText + "",
				n: "KeywordResponseText"
			}, {
				t: "S",
				v: this.questions[i].prompt + "",
				n: "PromptText"
			}, {
				t: "S",
				v: this.questions[i].jet.location + "",
				n: "Location"
			}, {
				t: "A",
				v: this.questions[i].jet.keywordResponseAudio + "",
				n: "KeywordResponseAudio"
			}, {
				t: "A",
				v: this.questions[i].jet.promptAudio + "",
				n: "PromptAudio"
			}]
		};

		// Save the JET
		var jetPath = path.join(thisFolder, "data.jet");
		fs.writeFile(jetPath, JSON.stringify(dataJet), function (err) {
			if (err)
				console.log("Couldn't save JET for episode", this.episodeId, "question", this.questions[i].id, "- error:", err);
		})
	}

	/*
	 ``create folder {name = "Question"}
	 ``foreach question
	 ````if !exists (folder {name = question.id})
	 ``````create folder {name = question.id}
	 ````populate folder
	 ``````vo.mp3
	 ``````joke.mp3
	 ````write out data.jet
	 */
};

QuestionPack.prototype.delete = function () {
	// TODO
};

module.exports = QuestionPack;
