chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		var detect = function () {
			if (url !== document.URL) {
				url = document.URL;
				beamlyView.destroy();
				loadPlugin();
			}
		};

		var url = document.URL,
			urlDetector = setInterval(function(){ detect() }, 100),
			episodeModel,
			tweetCollection,
			beamlyView;

		var loadPlugin = function() {
			var canonicalurl = 'http://' + window.location.hostname + window.location.pathname;
			episodeModel = new BeamlyClass.EpisodeModel(canonicalurl);
			tweetCollection = new BeamlyClass.TweetCollection();
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel, 'element': "#player-outer-outer"});
			episodeModel.fetch();
		};

		chrome.storage.onChanged.addListener(function(changes, namespace) {
			if (changes.beamlyActive !== "undefined")
				if (changes.beamlyActive.newValue)
					loadPlugin();
				else 
					beamlyView.destroy();
		});

		chrome.storage.sync.get('beamlyActive', function(items) {
            state = items.beamlyActive
            if ((typeof state == 'undefined') || (state === true))
                loadPlugin();		
		});
	}
	}, 10);
});
