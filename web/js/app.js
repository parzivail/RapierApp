/**
 * Created by Colby on 11/14/2017.
 */
const nconf = require('nconf'),
	fs = require('fs'),
	rq = require('electron-require'),
	temp = rq.set('local', './web/js/modules'),
	fileutils = rq.local('./fileutils'),
	by = rq.local('./by'),
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
function onQuiplashPathChange(newPath) {
	app.quipPath = newPath || app.quipPath;
	app.isQuiplashPathInvalid = !fileutils.isValidQuiplash(app.quipPath);
	if (app.isQuiplashPathInvalid) {
		alert.error("That isn't a valid Quiplash executable.<br /><br />A valid path looks similar to:<pre>C:\\Program Files (x86)\\...\\Quiplash\\Quiplash.exe</pre>")
	}
	else {
		nconf.set('quiplash:path', app.quipPath);
		nconf.save();
	}
}

/*
 * Vue App
 */
Vue.component('dlc-item', {
	props: ['dlc'],
	template: '<li><a href="#">{{ dlc.name }}</a></li>'
});

var app = new Vue({
	el: "#rapier",
	data: {
		isQuiplashPathInvalid: false,
		quipPath: nconf.get('quiplash:path'),
		loadedDlc: [
			{id: 0, name: "Quiplash Core", path: "/etc/quipdlc/core"},
			{id: 999, name: "CoolDLC", path: "/etc/quipdlc/cooldlc"},
			{id: 2938745, name: "BestDLC", path: "/etc/quipdlc/bestdlc"},
		]
	}
});

UIkit.tab("#tabDlc", {
	connect: "#component-nav",
	animation: "uk-animation-fade"
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
