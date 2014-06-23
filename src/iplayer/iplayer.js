chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		$.ajaxSetup({
		    headers: {
		        'zeebox-app-id': "0f434d35",
		        'zeebox-app-key': "0ef2d755c449584e232479a6be882c0f"
		    }
		});

		var SeriesModel = Backbone.Model.extend({
			url: "https://api-uk.zeebox.com/search/2/blended-search",
			parse: function(response, options) {
				console.log(response);
				var series = null;
				_.each(response.sections, function(section){
					if (section.display_type == 'Top Results' || section.display_type == 'TV Shows') {
						_.each(section.docs, function(doc) {
							if (doc.brands[0].title == seriesName) {
								series = doc
							}	
						})
					}
				})
				console.log (series);
				return (series);
			}
		});

		var EpisodeModel = Backbone.Model.extend({
			brandId: null,
			url: function() {
				return 'https://i.zeebox.com/tms/broadcastevents.json?brand=' + this.brandId + '&to=now&max-results=1&order-by=-start-time'
			},
			setBrandId: function(brandId) {
				this.brandId = brandId;
			}
		});

		var TwitterModel = Backbone.Model.extend({
			initialize: function(options) {
				this.url = 'https://api-uk.zeebox.com/api/1/hts/uk/metadata/' + options.id + '/';
			}
		});

		var EpisodeView = Backbone.View.extend({
			initialize: function(options) {
				that = this;
				this.seriesModel = options.seriesModel;
				this.episodeModel = new EpisodeModel();
				this.listenTo(seriesModel, 'change', function(model) {
					that.episodeModel.setBrandId(model.attributes.brands[0].id);
					that.episodeModel.fetch().then(function() {
						console.log(that.episodeModel.get('broadcastevents')[0].id);
						that.twitterModel = new TwitterModel({'id': that.episodeModel.get('broadcastevents')[0].id});
						that.twitterModel.fetch();
					});
				});
			}
		});

		seriesName = $('.stream-item .current .title').text().trim();
		seriesModel = new SeriesModel();
		episodeView = new EpisodeView({'seriesModel': seriesModel});
		seriesModel.fetch({data: $.param({"q": seriesName, "tvc": "uk"})}).then(function(){

		})


		// $.ajax({
		//   url: "https://api-uk.zeebox.com/search/2/blended-search",
		//   data: {
		//   	q: seriesName,
		//   	tvc: 'uk'
		//   },
		//   headers: {
		//   	'zeebox-app-id': '3ff3ec52',
		//   	'zeebox-app-key': 'b9ceab5038dfc6eae0875c3645093d7d'
		//   }
		// }).done(function(response) {
		// 	var tvRoomID = '';
		// 	for (var key = 0; key < response.sections.length; key++) {
		// 		if (response.sections[key].display_type === 'TV Rooms') {
		// 			tvRoomID = response.sections[key].docs[0].entity.id;
		// 		}
		// 	}

		// 	if (tvRoomID) {
		// 		var beamlyIframe = document.createElement("div");
		// 		beamlyIframe.setAttribute('id', 'beamly');
		// 		beamlyIframe.setAttribute('style', "width:" + (window.innerWidth - 1010) + "px");
		// 		document.getElementById("blq-container").appendChild(beamlyIframe);		

		// 		var beamlyCode = document.createElement("a");
		// 		beamlyCode.setAttribute('href', '//uk.beamly.com/tv/rooms/' + tvRoomID);
		// 		beamlyCode.setAttribute('data-zeebox-type', 'tv-room');
		// 		document.getElementById("beamly").appendChild(beamlyCode);			

		// 		var s = document.createElement('script');
		// 		s.src = '//static.zeebox.com/embed/1/zeebox.js';
		// 		s.onload = function() {
		// 		    this.parentNode.removeChild(this);
		// 		};
		// 		(document.head||document.documentElement).appendChild(s);
		// 	}
		// });
	}
	}, 10);
});
