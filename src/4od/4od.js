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

		var seriesName,
			episodeModel = new Backbone.Model(),
			tweetCollection = new BeamlyClass.TweetCollection(),
			beamlyView = new BeamlyClass.BeamlyView({'model': episodeModel});

		var lunchBeamly = function(response) {
			var startTime, 
				endTime,
				series = response;

			dateAndDuration = $("#broadcast-info").text().split("C4Duration: ");
			dateArray = dateAndDuration[0].split(" ");
			duration = parseInt(dateAndDuration[1]);


			dateString = dateArray[0] + ' ' + dateArray[2] + ' ' + dateArray[3] + ' ' + dateArray[4] + ' +000';
			momentTime = moment(dateString, "hA, DD MMMM YYYY ZZ");
			startTime = momentTime.zone("+000").format().replace(/-|:/g, "");
			endTime = momentTime.add('minutes', duration).zone("+000").format().replace(/-|:/g, "");

			startTime = startTime.slice(0, -5);
			endTime = endTime.slice(0, -5);

			startTime += "Z";
			endTime += "Z";

			fetchSeries(series, startTime, endTime)
			.done(function(response) {
				console.log(response);
				episodeModel.set(response);
				beamlyView.startFetch();
			})
			.fail(function(error){
				console.log (error);
			});				
		}

		seriesName = $("#brand-split-title").html()
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
