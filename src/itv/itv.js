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

		var seriesName = $("h2.episode-title").html(),
			episodeModel = new Backbone.Model(),
			tweetCollection = new BeamlyClass.TweetCollection(),
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel});

		moment.lang("en")

		var lunchBeamly = function(response) {
			var time = $(".hero .date-display-single").html(),
				startTime, 
				endTime,
				series = response;

			arr = time.split(' ');
			dateString = arr[0] + ' ' + arr[2] + ' ' + arr[3] + ' ' + arr[4] + ' +000';
			momentTime = moment(dateString, "hA, DD MMMM YYYY ZZ");
			startTime = momentTime.zone("+000").format().replace(/-|:/g, "");
			duration = parseInt($(".field-name-field-duration .field-item").html().replace(" minutes", ""));
			endTime = momentTime.add('minutes', duration).zone("+000").format().replace(/-|:/g, "");

			startTime = startTime.slice(0, -5);
			endTime = endTime.slice(0, -5);

			startTime += "Z";
			endTime += "Z";

			$.get('https://atlas.metabroadcast.com/3.0/content.json?uri=' + document.URL).then(function(response){
				startTime = 
				endTime = 
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

		BeamlyClass.fetchBrand(seriesName)
		.done(function(response) {
			lunchBeamly(response)
		})
		.fail(function(error){
			// unable to match series with name, lets try full name
			console.log (error);
			console.log('trying with full series name: ' + fullSeriesName);
		});
	}
	}, 10);
});
