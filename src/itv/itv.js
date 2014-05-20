chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);


		seriesName = $('.supplimentary .title.episode-title').text()
		$.ajax({
		  url: "https://api-uk.zeebox.com/search/2/blended-search",
		  data: {
		  	q: seriesName,
		  	tvc: 'uk'
		  },
		  headers: {
		  	'zeebox-app-id': '3ff3ec52',
		  	'zeebox-app-key': 'b9ceab5038dfc6eae0875c3645093d7d'
		  }
		}).done(function(response) {
			console.log(response);
			var tvRoomID = '';
			for (var key = 0; key < response.sections.length; key++) {
				if (response.sections[key].display_type === 'TV Rooms') {
					tvRoomID = response.sections[key].docs[0].entity.id;
				}
			}

			if (tvRoomID) {
				var beamlyIframe = document.createElement("div");
				beamlyIframe.setAttribute('id', 'beamly');
				beamlyIframe.setAttribute('style', "width:" + (window.innerWidth - 1002) + "px");
				$(".site-content.container-12.clearfix").append(beamlyIframe);		

				var beamlyCode = document.createElement("a");
				beamlyCode.setAttribute('href', '//uk.beamly.com/tv/rooms/' + tvRoomID);
				beamlyCode.setAttribute('data-zeebox-type', 'tv-room');
				document.getElementById("beamly").appendChild(beamlyCode);			

				var s = document.createElement('script');
				// TODO: add "script.js" to web_accessible_resources in manifest.json
				s.src = chrome.extension.getURL('js/jquery/zeebox.js');
				s.onload = function() {
				    this.parentNode.removeChild(this);
				};
				(document.head||document.documentElement).appendChild(s);
			}
		});


	}
	}, 10);
});