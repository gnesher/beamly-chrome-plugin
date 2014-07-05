var beamlyTemplate = '<ul id="beamly-header"><li id="beamly-logo"></li><li id="beamly-guide">GUIDE</li><li id="beamly-rooms">ROOMS</li></ul><div id="beamly-body"><ul id="beamly-loading"><li>Fetching Tweets...</li></ul><ul id="beamly-tweets"></ul><div class="beamly-footer"><div class="beamly-play"></div></div></div>'

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
				return ("http://hts.zeebox.com/api/1/hts/uk/populate/" + this.episodeId + "/" + this.timer + "/");
			else
				return ("http://hts.zeebox.com/api/1/hts/uk/poll/" + this.episodeId + "/" + this.timer + "/");
		},
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
		setEpisodeId: function(episodeId, time) {
			this.timer = time;
			this.episodeId = episodeId;
		},
		parse: function(response) {
			return response.tweets;
		}
	}),

	TweetView: Backbone.View.extend({
		tagName: "li",
		template: _.template("<img src='<%- imgurl %>'> <span><%= tweet %></span>"),
		initialize: function() {
			this.render();
		},
		render: function() {
			this.$el.html(this.template({'imgurl': this.model.get('tweet').user.profile_image_url, 'tweet': linkify_entities(this.model.get('tweet'))}));
			return (this);
		}
	}),

	EpisodeModel: Backbone.Model.extend({
		initialize: function(canonicalurl) {
			this.canonicalurl = encodeURIComponent(canonicalurl);
		},
		url: function() {
			return 'http://api.tanktop.tv/api/1/eyJzZXJ2aWNlX2lkIjoxMn0:1X3Kaw:rV-8rGpCMkY4-WMKpGEdKtpEf0k/lookup/byurl/?url=' + this.canonicalurl
		},
		parse: function(response) {
			if (response.episode_instances.length == 1) {
				return response.episode_instances[0]
			}
		}
	}),

	BeamlyView: Backbone.View.extend({
		tweets: [],
		count: 0,
		id: "beamlyView",
		template: beamlyTemplate,
		initialize: function(options) {
			this.element = options.element;
			this.tweetCollection = new BeamlyClass.TweetCollection();
			this.listenTo(this.tweetCollection, "add", this.updateTweets, this);
			this.listenTo(this.model, "change:beamly_eid", this.setEpisodeId, this);
		},
		events: {
			"click .beamly-play": "startFetch",
			"click .beamly-pause": "pauseFetch"
		},
		setEpisodeId: function() {
			this.tweetCollection.setEpisodeId(this.model.get('beamly_eid'), 120);
			this.render().startFetch();
		},
		updateTweets: function(model) {
			tweet = new BeamlyClass.TweetView({model: model});
			this.$("#beamly-tweets").prepend(tweet.$el);
			tweet.$el.hide().fadeIn().slideDown();
			this.tweets.push(tweet);
			if (this.tweets.length > 100) {
				oldTweet = this.tweets.shift().remove();
			}
				
		},
		pauseFetch: function() {
			this.tweetCollection.pause();
			this.$('#beamly-loading').animate({opacity: "0"}, 200);
			this.$('.beamly-pause').removeClass('beamly-pause').addClass('beamly-play');
		},
		startFetch: function() {
			this.$('#beamly-loading').animate({opacity: "1"}, 200);
			this.$('.beamly-play').removeClass('beamly-play').addClass('beamly-pause');
			this.tweetCollection.start();
		},
		render: function() {
			this.$el.html(this.template);
			jQuery(this.element).append(this.$el);
			return this
		}
	})
};