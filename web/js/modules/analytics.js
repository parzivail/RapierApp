/**
 * Created by colby on 11/23/2017.
 */
Analytics = require('electron-google-analytics').default;

module.exports = {
	init: function () {
		window.analytics = new Analytics('UA-110130188-1');
	},
	event: function (category, action) {
		return window.analytics.event(category, action)
			.then((response) => {
				return response;
			})
			.catch((err) => {
				throw err;
			});
	}
};