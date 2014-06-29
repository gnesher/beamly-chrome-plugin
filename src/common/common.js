var BeamlyClass = {
	originalSync: Backbone.sync,
	fetchBrand: function(seriesName) {
		var deferred = new $.Deferred();
		$.ajax({
			beforeSend: function(xhr) {
				xhr.setRequestHeader('zeebox-app-id', "0f434d35");
				xhr.setRequestHeader('zeebox-app-key', "0ef2d755c449584e232479a6be882c0f");
			},
			data: {"q": seriesName, "tvc": "uk"},
			url: "https://api-uk.zeebox.com/search/2/blended-search"
		}).done(function(response){
			var series = null;
			_.each(response.sections, function(section){
				if (section.display_type == 'Top Results') {
					_.each(section.docs, function(doc) {
						if (doc.name.toLowerCase() == seriesName.toLowerCase()) {
							series = doc;
						}	
					});
				}
			});
			if (series !== null) {
				deferred.resolve(series);
			} else {
				deferred.reject({'error': 'unable to match brand ID', 'success': false});
			}
		});
		return deferred.promise();
	},
	TweetCollection: Backbone.Collection.extend({
		previousLength: 0,
		reset: true,
		url: function() {
			if (this.reset)
				return ("https://api-uk.zeebox.com/api/1/hts/uk/populate/" + this.episodeId + "/" + this.timer + "/");
			else
				return ("https://api-uk.zeebox.com/api/1/hts/uk/poll/" + this.episodeId + "/" + this.timer + "/");
		},
		// initialize: function() {
		// 	this.on('sync', this.checkNewItems, this);
		// },
		// checkNewItems: function() {
		// 	console.log ('*********** sync *************');
		// 	if (this.previousLength !== this.models.length) {
		// 		newModels = this.models.slice(this.previousLength, this.models.length);
		// 		this.previousLength = this.models.length;
		// 		this.trigger('newTweets', newModels);
		// 	}
		// },
		pause: function() {
			clearInterval(this.interval);
		},
		start: function() {
			that = this;
			this.fetch({remove: false});
			this.reset = false;
			this.interval = setInterval(function() {
				that.timer += 6;
				that.fetch();
			}, 6000);
		},
		setEpisodeId: function(episodeId) {
			this.timer = 0;
			this.episodeId = episodeId;
		},
		sync: function(method, model, options) {
			options.headers = {
				'zeebox-app-id': "0f434d35",
				'zeebox-app-key': "0ef2d755c449584e232479a6be882c0f"
			};
			BeamlyClass.originalSync(method, model, options);
		},
		parse: function(response) {
			return response.tweets;
		}
	}),

	TweetView: Backbone.View.extend({
		tagName: "li",
		template: _.template("<img src='<%- imgurl %>'> <span><%- tweet %></span>"),
		initialize: function() {
			this.render();
		},
		render: function() {
			this.$el.html(this.template({'imgurl': this.model.get('tweet').user.profile_image_url, 'tweet': this.model.get('tweet').text}));
			return (this);
		}
	}),

	BeamlyView: Backbone.View.extend({
		count: 0,
		id: "beamlyView",
		template: "<ul id='beamly-loading'><li>Fetching Tweets...</li></ul><ul id='beamly-tweets'></ul><div class='beamly-footer'><div class='beamly-play'></div></div>",
		initialize: function() {
			this.tweetCollection = new BeamlyClass.TweetCollection();
			this.listenTo(this.tweetCollection, "add", this.updateTweets, this);
			this.listenTo(this.model, "change", this.render);
		},
		events: {
			"click .beamly-play": "startFetch",
			"click .beamly-pause": "pauseFetch"
		},
		updateTweets: function(model) {
			tweet = new BeamlyClass.TweetView({model: model});
			this.$el.children("#beamly-tweets").prepend(tweet.$el);
			tweet.$el.animate({opacity: "100"}, 1500);
		},
		pauseFetch: function() {
			this.tweetCollection.pause();
			this.$el.children('#beamly-loading').hide()
			this.$el.children('.beamly-footer').children('.beamly-pause').removeClass('beamly-pause').addClass('beamly-play');
		},
		startFetch: function() {
			this.$el.children('#beamly-loading').show()
			this.$el.children('.beamly-footer').children('.beamly-play').removeClass('beamly-play').addClass('beamly-pause');
			this.tweetCollection.start();
		},
		render: function() {
			this.tweetCollection.setEpisodeId(this.model.get('id'));
			this.$el.html(this.template);
			jQuery('#main').append(this.$el);
		}
	})
}