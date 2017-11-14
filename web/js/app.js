/**
 * Created by Colby on 11/14/2017.
 */
var fs = require('fs');

function resolveSteamPath(cb) {
	// Need to make cross-platform and not rely on the Windows Registry
	var Registry = require('winreg');
	var regKey = new Registry({
		hive: Registry.HKCU,
		key: '\\Software\\Valve\\Steam'
	});

	regKey.get("SteamPath", function (err, item) {
		if (err)
			return cb(null);
		else
			return cb(item.value);
	});
}

function manuallyResolveQuiplashPath() {
	console.log("queue manual resolution");
	return "path";
}

resolveSteamPath(function (steamPath) {
	var quiplashPath;

	console.log(steamPath);

	do {
		// Couldn't get it from the Registry
		if (!steamPath)
			quiplashPath = manuallyResolveQuiplashPath();
		else {
			quiplashPath = steamPath + "";
		}
	}
	while (!fs.existsSync(quiplashPath));
});
