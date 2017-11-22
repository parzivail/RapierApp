/**
 * Created by Colby on 11/14/2017.
 */
const nconf = require('nconf'),
	fs = require('fs'),
	path = require('path'),
	uuid = require('uuid/v4'),
	escape = require('escape-html'),
	openurl = require('openurl'),
	extract = require('extract-zip'),
	dialog = require('electron').remote.dialog,
	rq = require('electron-require'),
	temp = rq.set('local', './web/js/modules'),
	fileutils = rq.local('./fileutils'),
	by = rq.local('./by'),
	quiplash = rq.local('./quiplash'),
	alert = rq.local('./alert');

/*
 * Polyfill
 */

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 * Modified to fit Rapier use case
 *
 * @param str: the input value
 * @param seed: the hash of the previous chunk
 * @returns [integer]
 */
function hashFnv32a(str, seed) {
	var i, l,
		hval = seed;

	for (i = 0, l = str.length; i < l; i++) {
		hval ^= str.charCodeAt(i);
		hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	return hval >>> 0;
}

String.prototype.hashCode = function () {
	return hashFnv32a(this, 0xbadcafe)
};

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

function refreshDlc() {
	UIkit.tab("#tabDlc", {
		connect: "#component-nav"
	});
}

/*
 * Vue App
 */
var tabs,
	app = new Vue({
		el: "#rapier",
		computed: {
			creatorEpisodeId: function () {
				return this.creator.packId.hashCode();
			},
			editorPromptId: function () {
				return this.editorPrompt.text.hashCode();
			}
		},
		data: {
			isQuiplashPathInvalid: false,
			quipPath: nconf.get('quiplash:path'),
			contentFilter: [
				{
					name: "Content Pack",
					extensions: ["rap"]
				}
			],
			loadedDlc: [],
			appLoaded: false,
			editing: false,
			promptFilter: "",
			creator: {
				name: "",
				packId: "",
				metadata: {
					author: "",
					url: "",
					description: ""
				}
			},
			bulkAddPrompts: "",
			editorPrompt: {
				text: "",
				mature: false,
				jet: {
					author: "",
					location: "",
					hasJokeAudio: false,
					keywords: "",
					keywordResponseText: ""
				}
			},
			stripHtml: function (string) {
				return escape(string);
			},
			openUrl: function (url) {
				openurl.open(url);
			},
			switchToCreateTab: function () {
				tabs.show(2);
			},
			getNumFilteredQuestions: function (item) {
				var filter = this.promptFilter;
				return item.questions.filter(function (a) {
					return a.prompt.search(filter) !== -1 || !filter;
				}).length
			},
			addQuestion: function (item) {
				var prompt = "New Question Prompt";

				var newJet = {
					hasJokeAudio: false,
					keywords: [],
					author: "",
					keywordResponseText: "",
					promptText: prompt,
					location: "",
					keywordResponseAudio: "joke",
					promptAudio: "vo"
				};

				var newQuestion = {
					id: Math.round(Math.random() * 100000) + 40000,
					jet: newJet,
					prompt: prompt,
					uuid: uuid(),
					x: false
				};

				item.questions.unshift(newQuestion);
				this.startEditing(newQuestion);
			},
			addBulkQuestions: function (item) {
				var newPrompts = this.bulkAddPrompts.split("\n");

				for (var i = 0; i < newPrompts.length; i++) {
					var prompt = newPrompts[i];

					var newJet = {
						hasJokeAudio: false,
						keywords: [],
						author: "",
						keywordResponseText: "",
						promptText: prompt,
						location: "",
						keywordResponseAudio: "joke",
						promptAudio: "vo"
					};

					var newQuestion = {
						id: prompt.hashCode(),
						jet: newJet,
						prompt: prompt,
						uuid: uuid(),
						x: false
					};

					item.questions.push(newQuestion);
				}
			},
			deleteQuestion: function (item, prompt) {
				for (var i = 0; i < item.questions.length; i++) {
					if (item.questions[i].uuid !== prompt.uuid)
						continue;

					item.questions.splice(i, 1);
					return;
				}
			},
			startEditing: function (prompt) {
				this.editorPrompt.text = prompt.prompt;
				this.editorPrompt.mature = prompt.x;
				this.editorPrompt.uuid = prompt.uuid;
				this.editorPrompt.jet = prompt.jet;
				this.editorPrompt.jet.keywords = prompt.jet.keywords.join("\n");
				this.editing = true;
				tabs.show(3);
			},
			stopEditing: function () {
				// there has to be a better way to do this
				for (var dlc = 0; dlc < this.loadedDlc.length; dlc++)
					for (var i = 0; i < this.loadedDlc[dlc].questions.length; i++)
						if (this.loadedDlc[dlc].questions[i].uuid === this.editorPrompt.uuid) {
							this.editorPrompt.jet.keywords = this.editorPrompt.jet.keywords.split("\n");
							this.loadedDlc[dlc].questions.splice(i, 1, {
								prompt: this.editorPrompt.text,
								x: this.editorPrompt.mature,
								id: this.editorPromptId,
								jet: this.editorPrompt.jet
							});
							this.editing = false;
							this.editorPrompt.text = null;
							this.editorPrompt.mature = null;
						}
			},
			loadContentPack: function () {
				if (app.isQuiplashPathInvalid) {
					alert.info("You must select your Quiplash executable first.");
					return;
				}

				dialog.showOpenDialog({
					title: "Import DLC from...",
					filters: this.contentFilter
				}, function (fileName) {
					if (!fileName)
						return;

					var quipDir = fileutils.isValidQuiplash(this.quipPath);
					extract(fileName, {dir: path.join(quipDir, 'DLC', path.basename(fileName, path.extname(fileName)))}, function (err) {
						if (err)
							alert.error("Failed to import content pack: " + err);
						else
							alert.success("Imported pack successfully.");
					});
				});
			},
			createDlc: function () {
				var quipDir = fileutils.isValidQuiplash(this.quipPath);
				var dlcDir = path.join(quipDir, 'DLC');
				var newDlc = quiplash.createNewDlc(this.creator.name, this.creator.packId, this.creatorEpisodeId, this.creator.metadata, dlcDir);
				this.loadedDlc.push(newDlc);
				refreshDlc();
				alert.info("Your new DLC has been created. Keep in mind that the DLC WILL NOT be saved until you click <i>Save</i>");
				tabs.show(1);
				this.creator.name = "";
				this.creator.packId = "";
				this.creator.metadata.author = "";
				this.creator.metadata.description = "";
				this.creator.metadata.url = "";
			},
			saveDlc: function (dlc) {
				alert.confirm("Are you sure you want to save \"" + dlc.manifest.name + "\"? This will overwrite the current content.", function (shouldSave) {
					if (!shouldSave)
						return;
					dlc.save();
				})
			},
			exportDlc: function (dlc) {
				dialog.showSaveDialog({
					title: "Export DLC to...",
					filters: this.contentFilter
				}, function (fileName) {
					if (!fileName)
						return;

					dlc.export(fileName);
				});
			},
			deleteDlc: function (dlc) {
				if (dlc.episodeId === 1223)
					alert.info("You cannot delete the main content pack.");
				else
					alert.confirm("Are you sure you want to delete \"" + dlc.manifest.name + "\"? This cannot be undone.", function (shouldDelete) {
						if (!shouldDelete)
							return;
						dlc.delete();

						for (var i = 0; i < app.loadedDlc.length; i++) {
							if (app.loadedDlc[i].episodeId !== dlc.episodeId)
								continue;

							app.loadedDlc.splice(i, 1);
							return;
						}
					}, true)
			}
		}
	});

onQuiplashPathChange(nconf.get('quiplash:path'));

refreshDlc();

tabs = UIkit.tab("#nav", {
	connect: "#pages"
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

UIkit.upload('#qppick', {
	beforeAll: function (e) {
		onQuiplashPathChange(by.id("fileQuiplash").files[0].path);
		return false;
	}
});
