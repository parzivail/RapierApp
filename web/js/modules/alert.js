/**
 * Created by colby on 11/15/2017.
 */
module.exports = {
	error: function (message) {
		swal({
			title: 'Error',
			type: 'error',
			html: message
		})
	}
};