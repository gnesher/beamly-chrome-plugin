var beamlyTemplate = '<ul id="beamly-header"><li id="beamly-logo"></li><li id="tweetabout"><a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/beamly-ondemand/jddmmgjjfmfnjjbpiepnjbjhicimkdbe" data-text="I\'m watching <%= seriesName %> in iPlayer with @Beamly OnDemand replay tweets - get the plugin at" data-via="Beamly" data-count="none" data-dnt="true">Tweet</a></li></ul><div id="beamly-body"><ul id="beamly-loading"><li>Fetching Tweets...</li></ul><ul id="beamly-tweets"></ul><div class="beamly-footer"><div class="beamly-play"></div><div class="beamly-scrubber"><div class="beamly-scrubber-pos"</div></div></div></div>'

var BeamlyClass = {
	placeHolder: chrome.extension.getURL("images/placeholder.png"),
	originalSync: Backbone.sync,
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
		scrubTo: function(newTime) {
			this.reset = true;
			this.pause();
			this.timer = newTime;
			this.start();
		},
		start: function() {
			that = this;
			this.fetch();			
			this.reset = false;
			this.interval = setInterval(function() {
				that.timer += 6;
				that.fetch({remove: false});
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
		className: "clearfix",
		template: _.template("<img class='userlink' src='<%- imgurl %>'><div class='content'><div><strong class='userlink'><%= name %></strong> <span class='userlink'><%= username %></span> <span class='beamly-time'><%= revealtime %></span><div><%= tweet %></div></div>"),
		initialize: function() {
			this.render();
			this.$('img').error(function() {
				$(this).attr("src", BeamlyClass.placeHolder);
			});
		},
		events: {
			"click .userlink": 'gotoProfile',
			"click .beamly-time": 'gotoTweet'
		},
		gotoTweet: function() {
			var win = window.open('https://twitter.com/' + this.model.get('tweet').user.screen_name + '/status/' + this.model.get('tweet').id_str, '_blank');
			win.focus();
		},
		gotoProfile: function() {
			var win = window.open('https://twitter.com/' + this.model.get('tweet').user.screen_name, '_blank');
			win.focus();
		},
		removeInvalidChars: function(text) {
		    return text.replace(/[^\x00-\x7F]/g, "");
		},	
		render: function() {
			time = this.model.get('smesh').reveal_time;
			if (time < 0) {
				// Tweet happened before show started
				revealTime = ''
			} else {
				minutes = Math.floor(time/60)
				seconds = String(time%60);
				if (seconds.length == 1)
					seconds = "0".concat(seconds);
				revealTime = minutes + ":" + seconds;
			}

			data = {
				'imgurl': this.model.get('tweet').user.profile_image_url_https,
				'tweet': this.removeInvalidChars(linkify_entities(this.model.get('tweet'))),
				'name': this.model.get('tweet').user.name,
				'username': '@' + this.model.get('tweet').user.screen_name,
				'revealtime': revealTime
			}
			this.$el.html(this.template(data));
			return (this);
		}
	}),

	EpisodeModel: Backbone.Model.extend({
		initialize: function(canonicalurl) {
			this.canonicalurl = encodeURIComponent(canonicalurl);
		},
		url: function() {
			return 'http://bubbl-i.zeebox.com/bubbl/uk/ondemand?url=' + this.canonicalurl
		}
	}),

	BeamlyView: Backbone.View.extend({
		tweets: [],
		count: 0,
		id: "beamlyView",
		template: _.template(beamlyTemplate),
		initialize: function(options) {
			document.getElementsByTagName('body')[0].className+=' beamly';
			this.element = options.element;
			this.tweetCollection = new BeamlyClass.TweetCollection();
			this.listenTo(this.tweetCollection, "add", this.updateTweets, this);
			this.listenTo(this.model, "change:episode_id", this.setEpisodeId, this);
			this.listenTo(this.tweetCollection, "error", this.destroy, this);
			this.listenTo(this.model, "change:currentTime", this.updatePosition, this);
			this.model.set("currentTime", 0);
		},
		startScrubber: function() {
			var that = this;			
			this.interval = setInterval(function() {
				that.model.set("currentTime", that.model.get("currentTime")+1);
			}, 1000);
		},
		updatePosition: function() {
			this.$(".beamly-scrubber-pos").css("width", this.model.get("currentTime")/this.model.get("duration")*100 + "%");
		},
		events: {
			"click .beamly-play": "startFetch",
			"click .beamly-pause": "pauseFetch",
			"click #beamly-logo" : "openBeamly",
			"click .beamly-scrubber": "scrub"
		},
		scrub: function(el) {
			clearInterval(this.interval);
			var newTime = Math.floor(this.model.get('duration') * el.offsetX/240 / 6) * 6;
			this.model.set('currentTime', newTime);
			this.cleanTweets();
			this.tweetCollection.scrubTo(newTime);
			this.startScrubber();
		},
		cleanTweets: function() {
			_.each(this.tweets, function(tweet) {
				tweet.model.destroy();
				tweet.remove();
			});
			this.tweets = [];
		},
		openBeamly: function() {
			window.open("http://uk.beamly.com/tv/episode/" + this.model.get("episode_id") + "/?utm_source=beamly_ondemand&utm_medium=chrome&utm_campaign=launch");
		},
		setEpisodeId: function() {
			this.tweetCollection.setEpisodeId(this.model.get('episode_id'), 120);
			this.render().startFetch();
		},
		updateTweets: function(model) {
			tweet = new BeamlyClass.TweetView({model: model});
			if (this.tweets.length == 0 || tweet.model.get('smesh').reveal_time > this.tweets[0].model.get('smesh').reveal_time) {
				this.tweets.push(tweet);
				this.$("#beamly-tweets").prepend(tweet.$el);
			} else {
				this.tweets = this.tweets.concat([tweet]);
				this.$("#beamly-tweets").append(tweet.$el);
			}
			tweet.$el.hide().fadeIn().slideDown();
			if (this.tweets.length > 100) {
				oldTweet = this.tweets.shift().remove();
			}				
		},
		destroy: function () {
			document.body.className = document.body.className.replace("beamly","");
			this.pauseFetch();
			this.cleanTweets();
			this.remove();
		},
		pauseFetch: function() {
			clearInterval(this.interval);
			this.tweetCollection.pause();
			this.$('#beamly-loading').animate({opacity: "0"}, 200);
			this.$('.beamly-pause').removeClass('beamly-pause').addClass('beamly-play');
		},
		startFetch: function() {
			this.$('#beamly-loading').animate({opacity: "1"}, 200);
			this.$('.beamly-play').removeClass('beamly-play').addClass('beamly-pause');
			this.tweetCollection.start();
			this.startScrubber();
		},
		render: function() {
			this.$el.html(this.template({"seriesName": this.model.get('title')}));
			jQuery(this.element).append(this.$el);

			// Can't load twitter widget through manifest, need to investigate other solutions - http://www.appuntivari.net/informatica/programmazione/chrome-extension/how-to-integrate-twitter-and-google-apis-in-chrome-extension
			!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
			return this
		}
	})
};
