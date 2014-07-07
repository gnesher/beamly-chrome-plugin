document.addEventListener('DOMContentLoaded', function () {
	console.log('in');
	$("#beamlyon").click(function() {
		console.log('pressed');
		alert('on');
	});
	$("#beamlyoff").click(function() {
		alert('off');
	});
});
