/**
 * Created by colby on 11/16/2017.
 */
var jsonfile = require('jsonfile'),
	path = require('path'),
	rq = require('electron-require'),
	temp = rq.set('local', './web/js/modules'),
	Manifest = rq.local('./quiplash-structs/manifest');
QuestionPack = rq.local('./quiplash-structs/questionpack');

module.exports = {
	loadDlcPath: function (dlcpath) {
		var manifestPath = path.join(dlcpath, 'manifest.jet'),
			questionPath = path.join(dlcpath, 'Question.jet');

		if (!fs.existsSync(manifestPath))
			return null;
		var manifest = jsonfile.readFileSync(manifestPath);
		if (!manifest)
			return null;
		manifest = new Manifest(manifest.id, manifest.name, manifest.types);
		if (!manifest.validate())
			return null;

		if (!fs.existsSync(questionPath))
			return null;
		var questions = jsonfile.readFileSync(questionPath);
		if (!questions)
			return null;
		questions = new QuestionPack(questions, manifest);
		if (!manifest.validate())
			return null;

		return questions;
	}
};