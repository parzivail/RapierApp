/**
 * Created by colby on 11/15/2017.
 */
module.exports = {
	info: function (message) {
		swal({
			title: 'Notice',
			type: 'info',
			html: message
		})
	},
	error: function (message) {
		swal({
			title: 'Error',
			type: 'error',
			html: message
		})
	},
	confirm: function (message, cb, reverseFocus) {
		swal({
			title: 'Confirm',
			html: message,
			type: 'warning',
			focusConfirm: !reverseFocus,
			focusCancel: !!reverseFocus,
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No'
		}).then(function (result) {
			cb(result.value);
		}).catch(function () {
			cb(false);
		});
	}
};