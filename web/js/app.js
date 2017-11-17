/**
 * Created by Colby on 11/14/2017.
 */
const nconf = require('nconf'),
	fs = require('fs'),
	path = require('path'),
	rq = require('electron-require'),
	temp = rq.set('local', './web/js/modules'),
	fileutils = rq.local('./fileutils'),
	by = rq.local('./by'),
	quiplash = rq.local('./quiplash'),
	alert = rq.local('./alert');

/*
 * Config
 */
nconf.file({file: 'config.json'});

if (!nconf.get('quiplash'))
	nconf.set('quiplash:path', "");

/*
 * UI Helpers
 */
function loadDlcFromInstallDir() {
	var quipDir = fileutils.isValidQuiplash(app.quipPath);
	if (quipDir) {
		app.loadedDlc.splice(0, app.loadedDlc.length);
		var defaultPack = quiplash.loadDlcPath(path.join(quipDir, 'content'));
		if (!defaultPack)
			throw new Error("Could not load Quiplash content");

		app.loadedDlc.push(defaultPack);

		var dlcDir = path.join(quipDir, 'DLC'),
			otherPackDirs = fs.readdirSync(dlcDir).filter(f => fs.statSync(path.join(dlcDir, f)).isDirectory());
		for (var i = 0; i < otherPackDirs.length; i++)
			app.loadedDlc.push(quiplash.loadDlcPath(path.join(dlcDir, otherPackDirs[i])));
	}
	else {
		alert.error("Navigate to the SETUP tab to select your Quiplash installation.");
	}
}

function onQuiplashPathChange(newPath) {
	app.appLoaded = false;
	app.quipPath = newPath || app.quipPath;
	app.isQuiplashPathInvalid = !fileutils.isValidQuiplash(app.quipPath);
	if (app.isQuiplashPathInvalid) {
		alert.error("That isn't a valid Quiplash executable.<br /><br />A valid path looks similar to:<pre>C:\\Program Files (x86)\\...\\Quiplash\\Quiplash.exe</pre>")
	}
	else {
		loadDlcFromInstallDir();
		nconf.set('quiplash:path', app.quipPath);
		nconf.save();
	}
	app.appLoaded = true;
}

/*
 * Vue App
 */
var app = new Vue({
	el: "#rapier",
	data: {
		isQuiplashPathInvalid: false,
		quipPath: nconf.get('quiplash:path'),
		loadedDlc: [],
		appLoaded: false,
		editorPrompt: {
			text: "",
			id: 0,
			mature: false
		},
		startEditing: function (prompt) {
			this.editorPrompt.text = prompt.prompt;
			this.editorPrompt.id = prompt.id;
			this.editorPrompt.mature = prompt.x;
		}
	}
});

onQuiplashPathChange(nconf.get('quiplash:path'));

UIkit.tab("#tabDlc", {
	connect: "#component-nav"
});

/*
 * Events
 */
by.id("textQuiplash").onkeyup = function () {
	app.isQuiplashPathInvalid = !fileutils.isValidQuiplash(app.quipPath);
};

by.id("textQuiplash").onchange = function () {
	onQuiplashPathChange();
};

UIkit.upload('.js-upload', {
	beforeAll: function (e) {
		onQuiplashPathChange(by.id("fileQuiplash").files[0].path);
		return false;
	}
});
