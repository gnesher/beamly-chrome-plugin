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
			urlDetector = setInterval(function(){ detect() }, 100);

		var lunchBeamly = function(response) {
			var startTime, 
				endTime,
				series = response;
			$.get('https://atlas.metabroadcast.com/3.0/content.json?uri=' + document.URL).then(function(response){
				startTime = response.contents[0].broadcasts[0].transmission_time.replace(/-|:/g, "")
				endTime = response.contents[0].broadcasts[0].transmission_end_time.replace(/-|:/g, "")
				fetchSeries(series, startTime, endTime)
				.done(function(response) {
					episodeModel.set(response);
					beamlyView.startFetch();
				})
				.fail(function(error){
					console.log (error);
				});				
			});						
		}


		var fetchSeries = function(series, startTime, endTime) {
			var deferred = new $.Deferred();
			searchString = "https://i.zeebox.com/tms/broadcastevents.json?brand=" + series.brands[0].id + "&from=" + startTime + "&to=" + endTime + "&max-results=1&order-by=-start-time";
			$.ajax({
				beforeSend: function(xhr) {
					xhr.setRequestHeader('zeebox-app-id', "0f434d35");
					xhr.setRequestHeader('zeebox-app-key', "0ef2d755c449584e232479a6be882c0f");
				},
				url: searchString
			}).done(function(response){
				$.ajax({
					url: "http://i.zeebox.com/tms/broadcastevents/" + response.broadcastevents[0].id + ".json"
				}).done(function(response){		
					episodeID = response.episode.id;
					$.ajax({
						url: "http://i.zeebox.com/tms/broadcastevents/" + episodeID + ".json"
					}).done(function(response){
						deferred.resolve(response);
					}).error(function(response) {
						deferred.reject({'error': 'HTS not avilable for episode, aborting'});
					});
				})
				.error(function(response){
					deferred.reject({});
				});
			});
			return deferred.promise();						
		};

		var seriesName,
			fullSeriesName,
			episodeModel,
			tweetCollection,
			beamlyView;


		var loadPlugin = function() {
			episodeModel = new Backbone.Model();
			tweetCollection = new BeamlyClass.TweetCollection();
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel});

			$.get('http' + window.location.hostname + window.location.pathname + '.json').then(function(response){
				seriesName = response.jsConf.player.title
				fullSeriesName = seriesName + ' ' + response.jsConf.player.subtitle
				BeamlyClass.fetchBrand(seriesName)
				.done(function(response) {
					lunchBeamly(response)
				})
				.fail(function(error){
					// unable to match series with name, lets try full name
					console.log (error);
					console.log('trying with full series name: ' + fullSeriesName);
					BeamlyClass.fetchBrand(fullSeriesName)
					.done(function(response) {
						lunchBeamly(response)
					})
					.fail(function(error){
						console.log (error);
					});
				});
			})
		};

		loadPlugin();

	}
	}, 10);
});
