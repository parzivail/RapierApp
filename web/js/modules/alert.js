/**
 * Created by colby on 11/15/2017.
 */
module.exports = {
	info: function (message, cb) {
		swal({
			title: 'Notice',
			type: 'info',
			html: message
		})
			.then(cb ? cb : function () {
				})
			.catch(cb ? cb : function () {
				});
	},
	error: function (message, cb) {
		swal({
			title: 'Error',
			type: 'error',
			html: message
		})
			.then(cb ? cb : function () {
				})
			.catch(cb ? cb : function () {
				});
	},
	success: function (message, cb) {
		swal({
			title: 'Success',
			type: 'success',
			html: message
		})
			.then(cb ? cb : function () {
				})
			.catch(cb ? cb : function () {
				});
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
		})
			.then(cb)
			.catch(cb);
	}
};
