chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		url = document.URL.split('/');
		series = url[url.length-1];
		seriesName = series.split('-')[0];

		TweetCollection = Backbone.Collection.extend({
			url: function() {
				return "https://api-uk.zeebox.com/api/1/hts/uk/populate/" + this.episodeID + "/" + this.timer + "/"
			}
			start: function(episodeID) {
				this.episodeID = episodeID;
				this.fetch();
				setInterval(function() {
					this.timer += 6;
					this.fetch();
				}, 6000);
			},
			sync: function(method, model, options) {

				Backbone.sync.call(method, model, options);
			}
		});

		$.ajax({
			beforeSend: function(xhr) {
				xhr.setRequestHeader('zeebox-app-id', "0f434d35");
				xhr.setRequestHeader('zeebox-app-key', "0ef2d755c449584e232479a6be882c0f");
			},
			data: {"q": seriesName, "tvc": "uk"},
			url: "https://api-uk.zeebox.com/search/2/blended-search"
		}).then(function(response){
			var series = null;
			_.each(response.sections, function(section){
				if (section.display_type == 'Top Results') {
					_.each(section.docs, function(doc) {
						if (doc.name == seriesName) {
							series = doc
						}	
					})
				}
			})
			if (series != null) {
				$.ajax({
					beforeSend: function(xhr) {
						xhr.setRequestHeader('zeebox-app-id', "0f434d35");
						xhr.setRequestHeader('zeebox-app-key', "0ef2d755c449584e232479a6be882c0f");
					},
					url: "https://i.zeebox.com/tms/broadcastevents.json?brand=" + series.brands[0].id + "&to=now&max-results=1&order-by=-start-time"
				}).then(function(response){
					$.ajax({
						url: "http://i.zeebox.com/tms/broadcastevents/" + response.broadcastevents[0].id + ".json"
					}).then(function(response){		
						episodeID = response.episode.id;
						$.ajax({
							url: "http://i.zeebox.com/tms/broadcastevents/" + episodeID + ".json"
						}).then(function(response){		
							$.ajax({
								beforeSend: function(xhr) {
									xhr.setRequestHeader('zeebox-app-id', "0f434d35");
									xhr.setRequestHeader('zeebox-app-key', "0ef2d755c449584e232479a6be882c0f");
								},								
								url: "https://api-uk.zeebox.com/api/1/hts/uk/populate/" + episodeID + "/6000/"
							}).then(function(response){		
								console.log(response);
							});
						});
					});
				});			
			}

		});

	}
	}, 10);
});
