chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		var detect = function () {
			if (url !== document.URL) {
				url = document.URL;
				beamlyView.pauseFetch();
				beamlyView.remove();
				beamlyView = null;
				episodeModel = null;
				tweetCollection = null;
				loadPlugin();
			}
		};

		var url = document.URL,
			urlDetector = setInterval(function(){ detect() }, 100),
			episodeModel,
			tweetCollection,
			beamlyView;

		var loadPlugin = function() {
			var canonicalurl = document.evaluate("//link[@rel='canonical']/@href", document, null, XPathResult.STRING_TYPE, null).stringValue;
			episodeModel = new BeamlyClass.EpisodeModel(canonicalurl);
			tweetCollection = new BeamlyClass.TweetCollection();
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel, 'element': "#player-outer-outer"});
			episodeModel.fetch();
		};

		loadPlugin();

	}
	}, 10);
});
