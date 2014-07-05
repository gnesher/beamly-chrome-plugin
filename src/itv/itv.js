chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		var canonicalurl = document.URL,
			episodeModel = new BeamlyClass.EpisodeModel(canonicalurl),
			tweetCollection = new BeamlyClass.TweetCollection(),
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel, 'element': '.player-wrapper '});

		episodeModel.fetch();
	}
	}, 10);
});
