function restore_options() {
  chrome.storage.sync.get('beamlyActive', function(items) {
    state = items.beamlyActive
    if(chrome.runtime.lastError) {
        state = true
    }
    $('#myonoffswitch').attr('checked', state);
  });
};

function set_options() {
  chrome.storage.sync.set({
    beamlyActive: $('#myonoffswitch').is(':checked')
  }), function () {
  };
};

document.addEventListener('DOMContentLoaded', function () {
	restore_options();
	$("#myonoffswitch").click(function() {
		set_options()
	});
});
