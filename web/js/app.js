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
	zipFolder = require("zip-folder"),
	dialog = require('electron').remote.dialog,
	rq = require('electron-require'),
	temp = rq.set('local', './web/js/modules'),
	fileutils = rq.local('./fileutils'),
	by = rq.local('./by'),
	quiplash = rq.local('./quiplash'),
	alert = rq.local('./alert'),
	analytics = rq.local('./analytics');

/*
 * Analytics
 */
analytics.init();

// emit init event
analytics.event('core', 'init');

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
// load the config
nconf.file({file: 'config.json'});
var firstTimeLoad = false;

// determine if we've loaded this instance before
if (!nconf.get('quiplash')) {
	nconf.set('quiplash:path', "");
	firstTimeLoad = true;
}

/*
 * Vue App
 */
// keep a record of the main tabs so we can switch between them
var tabs,
	// behold, the main app
	app = new Vue({
		// the main div to work with
		el: "#rapier",
		// computed variables
		computed: {
			// make a unique* episode ID based on the pack ID
			creatorEpisodeId: function () {
				return this.creator.packId.hashCode();
			},
			// make a unique* prompt ID based on the prompt itself
			editorPromptId: function () {
				return this.editorPrompt.text.hashCode();
			}
			// * "unique": the chances are so small that two questions would overlap,
			// it isn't an issue in any game. Should they overlap, I presume one
			// question won't be displayed in favor of the other question with the
			// same ID. Haven't been able to test that.
		},
		data: {
			// truthy of the quiplash install path
			isQuiplashPathInvalid: false,
			// whether or not they're editing a question
			editing: false,
			// regex filter for the prompts
			promptFilter: "",
			// temp holder for the bulk editor text box
			bulkAddPrompts: "",
			// temp holder for the create DLC menu values
			creator: {
				name: "",
				packId: "",
				metadata: {
					author: "",
					url: "",
					description: ""
				}
			},
			// temp holder for the prompt editor menu values
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
			// quiplash install path
			quipPath: nconf.get('quiplash:path'),
			// file filter for import/export dialogs
			contentFilter: [
				{
					name: "Content Pack",
					extensions: ["rap"]
				}
			],
			// loaded DLCs
			loadedDlc: [],
			// render helper for stripping HTML tags from manifest values
			stripHtml: function (string) {
				return escape(string);
			},
			// render helper for opening a URL in a browser that isn't this window
			openUrl: function (url) {
				openurl.open(url);
			},
			// render helper for switching to the Create DLC tab
			switchToCreateTab: function () {
				tabs.show(2);
			},
			// render helper for getting the number of questions after the filter has been applied
			getNumFilteredQuestions: function (item) {
				var filter = this.promptFilter;
				return item.questions.filter(function (a) {
					return a.prompt.search(filter) !== -1 || !filter;
				}).length
			},
			// render helper for adding the new tabs to UIkit
			refresh: function () {
				UIkit.tab("#tabDlc", {
					connect: "#component-nav"
				});
			},
			// shows the user a dialog to select their Quiplash install
			selectQuipExe: function () {
				dialog.showOpenDialog({
					title: "Select Quiplash executable",
					filters: [
						{
							name: "Executable",
							extensions: ["exe"]
						}
					]
				}, function (fileName) {
					if (!fileName)
						return;

					app.setPath(fileName[0]);
				});
			},
			// sets the Quiplash install path and updates the app state accordingly
			setPath: function (newPath) {
				// if we don't supply a new path, keep the old one
				this.quipPath = newPath || this.quipPath;
				// validate the path
				this.isQuiplashPathInvalid = !fileutils.isValidQuiplash(this.quipPath);
				if (this.isQuiplashPathInvalid) {
					if (firstTimeLoad) // Don't want to scare them with a nasty error on first launch
						alert.info("To begin, navigate to the <i>Rapier Setup</i> tab select your Quiplash executable.");
					else
						alert.error("That isn't a valid Quiplash executable.<br /><br />A valid path looks similar to:<pre>...\\Steam\\steamapps\\common\\Quiplash\\Quiplash.exe</pre>")
				}
				else {
					// load the DLC and save the config if the path is valid
					this.loadAllDlc();
					nconf.set('quiplash:path', this.quipPath);
					nconf.save();
				}
			},
			// loads all of the available DLC in the user's install folder
			loadAllDlc: function () {
				// get the install path
				var quipDir = fileutils.isValidQuiplash(this.quipPath);
				// validate the path
				if (quipDir) {
					// remove all DLC in a way that Vue can track
					this.loadedDlc.splice(0, this.loadedDlc.length);

					// load the main content in a special way since it's its own folder
					var defaultPack = quiplash.loadDlcPath(path.join(quipDir, 'content'));
					if (!defaultPack) {
						alert.error("Failed to load main Quiplash content. Your Quiplash installation may be corrupt.");
						return;
					}
					this.loadedDlc.push(defaultPack);

					// load all of the DLC packs
					var failed = 0;
					var dlcDir = path.join(quipDir, 'DLC'),
						// packs are stored in directories, not files
						otherPackDirs = fs.readdirSync(dlcDir).filter(f => fs.statSync(path.join(dlcDir, f)).isDirectory());
					for (var i = 0; i < otherPackDirs.length; i++) {
						// load the DLC of each directory
						var pack = quiplash.loadDlcPath(path.join(dlcDir, otherPackDirs[i]));
						// save the DLC if it's a success
						if (pack)
							this.loadedDlc.push(pack);
						else
							failed++;
					}
					// tell the user about any failed loads
					if (failed > 0)
						alert.error("Failed to load " + failed + " content pack" + (failed == 1 ? "" : "s") + ".");
				}
				else {
					// throw an error to the user
					alert.error("Navigate to the <i>Rapier Setup</i> tab select a valid Quiplash executable.");
				}
			},
			// adds a new question to the current DLC
			addQuestion: function (item, bulk, bulkPrompt) {
				// have a default prompt so we can use this for not-bulk stuff
				var prompt = bulkPrompt || "New Question Prompt";

				// init a new JET metadata
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

				// init a new question object
				var newQuestion = {
					id: bulkPrompt ? prompt.hashCode() : Math.round(Math.random() * 100000) + 40000,
					jet: newJet,
					prompt: prompt,
					uuid: uuid(),
					x: false
				};

				if (bulk) {
					// bulk questions pushed to the end
					item.questions.push(newQuestion);
				}
				else {
					// non-bulk questions pushed to the beginning. allow the user to edit the new question.
					item.questions.unshift(newQuestion);
					this.startEditing(newQuestion);

					// emit an event
					analytics.event('question', 'add');
				}
			},
			// adds questions in bulk from the bulk add menu
			addBulkQuestions: function (item) {
				// each prompt has it's own line
				var newPrompts = this.bulkAddPrompts.split("\n");

				// add each question of the bulk
				for (var i = 0; i < newPrompts.length; i++)
					this.addQuestion(item, true, newPrompts[i])

				// clear the menu
				this.bulkAddPrompts = null;

				analytics.event('question', 'add-bulk');
			},
			// deletes the selected question
			deleteQuestion: function (item, prompt) {
				// best way to find the question is to search for it. thanks, JavaScript.
				for (var i = 0; i < item.questions.length; i++) {
					if (item.questions[i].uuid !== prompt.uuid)
						continue;

					// remove it in a way Vue can track
					item.questions.splice(i, 1);
					return;
				}

				// emit an event
				analytics.event('question', 'delete');
			},
			// starts editing the selected question
			startEditing: function (prompt) {
				// copy over the current question's values to the temp holder
				this.editorPrompt.text = prompt.prompt;
				this.editorPrompt.mature = prompt.x;
				this.editorPrompt.uuid = prompt.uuid;
				this.editorPrompt.jet = prompt.jet;
				this.editorPrompt.jet.keywords = prompt.jet.keywords.join("\n");
				this.editing = true;
				// show the user the edit tab
				tabs.show(3);
			},
			// stop editing the selected question and overwrite the old data with the new
			stopEditing: function () {
				// there's no better way to find out where the question came from than to search
				for (var dlc = 0; dlc < this.loadedDlc.length; dlc++)
					for (var i = 0; i < this.loadedDlc[dlc].questions.length; i++)
						if (this.loadedDlc[dlc].questions[i].uuid === this.editorPrompt.uuid) {
							// when we find it, copy back all of the data from the temp holder
							this.editorPrompt.jet.keywords = this.editorPrompt.jet.keywords.split("\n");
							// change the data in a way Vue can track
							this.loadedDlc[dlc].questions.splice(i, 1, {
								prompt: this.editorPrompt.text,
								x: this.editorPrompt.mature,
								id: this.editorPromptId,
								jet: this.editorPrompt.jet
							});
							// stop editing
							this.editing = false;
							// clear the editor
							this.editorPrompt.text = null;
							this.editorPrompt.mature = null;
						}
			},
			// imports DLC from a RAP file
			importDlc: function () {
				// make sure the destination path exists
				if (!fileutils.isValidQuiplash(app.quipPath)) {
					alert.info("You must select your Quiplash executable first.");
					return;
				}

				dialog.showOpenDialog({
					title: "Import DLC from...",
					filters: this.contentFilter
				}, function (fileName) {
					if (!fileName)
						return;

					// make sure what they selected is valid
					var quipDir = fileutils.isValidQuiplash(this.quipPath);
					// go ahead and extract the DLC from the RAP
					extract(fileName, {dir: path.join(quipDir, 'DLC', path.basename(fileName, path.extname(fileName)))}, function (err) {
						if (err) {
							Rollbar.error("Failed to unpack RAP", err);
							alert.error("Failed to import content pack: " + err);
						}
						else
							alert.success("Imported pack successfully.");
					});
				});

				// emit an event
				analytics.event('dlc', 'import');
			},
			// exports DLC to a RAP file
			exportDlc: function (dlc) {
				dialog.showSaveDialog({
					title: "Export DLC to...",
					filters: this.contentFilter,
					defaultPath: dlc.manifest.id
				}, function (fileName) {
					if (!fileName)
						return;

					// zip the DLC folder and send it to wherever the user selected
					zipFolder(dlc.contentPath, fileName, function (err) {
						if (err) {
							Rollbar.error("Failed to pack RAP", err);
							alert.error("Failed to export content pack: " + err);
						}
						else
							console.log("Exported pack as", fileName);
					});
				});

				// emit an event
				analytics.event('dlc', 'export');
			},
			// creates a new DLC pack with the values from the Create Pack menu
			createDlc: function () {
				// validate Quiplash install and create new DLC instance
				var quipDir = fileutils.isValidQuiplash(this.quipPath);
				var dlcDir = path.join(quipDir, 'DLC');
				var newDlc = quiplash.createNewDlc(this.creator.name, this.creator.packId, this.creatorEpisodeId, this.creator.metadata, dlcDir);

				// add the DLC to the list
				this.loadedDlc.push(newDlc);
				this.refresh();

				//show a warning about data retention
				alert.info("Your new DLC has been created. Keep in mind that the DLC WILL NOT be saved until you click <i>Save</i>", function () {
					// go to the DLC tab
					tabs.show(1);

					// show this new DLC
					UIkit.tab("#tabDlc", {
						connect: "#component-nav"
					}).show(app.loadedDlc.length - 1);
				});

				// clear the Create tab fields
				this.creator.name = "";
				this.creator.packId = "";
				this.creator.metadata.author = "";
				this.creator.metadata.description = "";
				this.creator.metadata.url = "";

				// emit an event
				analytics.event('dlc', 'create');
			},
			// saves the selected DLC
			saveDlc: function (dlc) {
				alert.confirm("Are you sure you want to save \"" + dlc.manifest.name + "\"? This will overwrite the current content.", function (shouldSave) {
					if (!shouldSave)
						return;
					dlc.save();
				});
			},
			// deletes the selected DLC
			deleteDlc: function (dlc) {
				// you CAN delete the main content pack, but things can go horribly wrong
				if (dlc.episodeId === 1223)
					alert.info("You cannot delete the main content pack.");
				else {
					alert.confirm("Are you sure you want to delete \"" + dlc.manifest.name + "\"? This cannot be undone.", function (shouldDelete) {
						if (!shouldDelete)
							return;
						dlc.delete();

						// now that the DLC is deleted, make sure it gets removed from the listings
						for (var i = 0; i < app.loadedDlc.length; i++) {
							if (app.loadedDlc[i].episodeId !== dlc.episodeId)
								continue;

							app.loadedDlc.splice(i, 1);
							return;
						}
					}, true);

					// emit an event
					analytics.event('dlc', 'delete');
				}
			}
		}
	});

// init the app with the config's Quiplash path
app.setPath(nconf.get('quiplash:path'));
app.refresh();

// grab the nav tabs
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
	app.setPath();
};
