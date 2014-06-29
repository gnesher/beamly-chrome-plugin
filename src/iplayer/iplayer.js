chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

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

		var url = document.URL.split('/'),
			series = url[url.length-1],
			seriesName = $(".more-episodes .current .title").length > 0 ? $(".more-episodes .current .title").html().trim() : series.split('-')[0],
			episodeModel = new Backbone.Model(),
			tweetCollection = new BeamlyClass.TweetCollection(),
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel});

		BeamlyClass.fetchBrand(seriesName)
		.done(function(response) {
			var startTime, 
				endTime,
				series = response;
			$.get('https://atlas.metabroadcast.com/3.0/content.json?uri=' + document.URL).then(function(response){
				startTime = response.contents[0].broadcasts[0].transmission_time.replace(/-|:/g, "")
				endTime = response.contents[0].broadcasts[0].transmission_end_time.replace(/-|:/g, "")
				fetchSeries(series, startTime, endTime)
				.done(function(response) {
					episodeModel.set(response);
				})
				.fail(function(error){
					console.log (error);
					console.log (seriesName);
				});				
			});			
		})
		.fail(function(error){
			console.log (error);
		});
	}
	}, 10);
});
