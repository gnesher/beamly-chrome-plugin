checkPhrase = function(phrase) {
	var promise = $.ajax({
	  url: "http://api-uk.zeebox.com/blabber/1/uk/mentions",
	  data: {
	  	prefix: phrase
	  },
	  headers: {
	  	'zeebox-app-id': '3ff3ec52',
	  	'zeebox-app-key': 'b9ceab5038dfc6eae0875c3645093d7d'
	  }
	}).done(function(response) {
		var selectedObj = null;

		// We have a match
		if (response.mentions.length > 0) {
			var brandArray = []
			// Lets see if our match/s are brands (we also get celebreties)
			for (var i = 0;i < response.mentions.length; i++) {
				var tempObj = {}
				for (var x = 0;x < response.mentions[i].feed.nodes.length; x++) {
					if (response.mentions[i].feed.nodes[x].brand) {
						brandArray.push(response.mentions[i]);
					}
				}
			}

			if (brandArray.length > 0)
				selectedObj = brandArray[0];

			if (brandArray.length > 1)
				for (var i = 1;i < response.mentions.length; i++) {
					if (selectedObj.score < response.mentions[i].score)
						selectedObj = response.mentions[i]
				}

		} 

		if (selectedObj) {
			showBeamly(selectedObj);
		} else {
			if (loc < titleArray.length) {
				phrase += ' ' + titleArray[loc];
				loc++;
				checkPhrase(phrase);
			}
		}
	});
	return (promise);
}

showBeamly = function(data) {
	var beamlyIframe = document.createElement("div");
	beamlyIframe.setAttribute('id', 'beamly');
	$("#watch7-content").after(beamlyIframe);	
	$("#beamly").append('<span class="icon-beamly"></span><span class="on-demand-logo"><strong>On Demand</strong></span><p>' + data.feed.description + '</p>');
	var brandid = '';
	for (var i = 0;i < data.feed.nodes.length; i++) {
		if (data.feed.nodes[i].brand)
			brandid = data.feed.nodes[i].brand 
	}
	$.ajax({
	  url: "https://api-uk.zeebox.com/meta/nexton",
	  data: {
	  	brand: brandid
	  },
	  headers: {
	  	'zeebox-app-id': '3ff3ec52',
	  	'zeebox-app-key': 'b9ceab5038dfc6eae0875c3645093d7d'
	  }
	}).done(function(response) {
		$("#beamly").append('<h3>Next show times:</h3><ul id="showlist">');
		for (var i = 0;i < response.length; i++) {
			showTime = response[i].start_time;
			$.ajax({
			  url: response[i].epg,
			  headers: {
			  	'zeebox-app-id': '3ff3ec52',
			  	'zeebox-app-key': 'b9ceab5038dfc6eae0875c3645093d7d'
			  }
			}).done(function(response) {				
				for (var key in response.aired_by) {
					service_name = response.aired_by[key].service_name;
				}
				$("#showlist").append('<li><a href="//uk.beamly.com/tv/shows/fazz/' + response.brand_id +'" target="_blank">'+ showTime + ' on ' + service_name + '</a></li>');
			});
		}
		$("#beamly").append('</ul>');
	});	
}

var youtubeTitle = $('#eow-title').attr("title");
var titleArray = youtubeTitle.split(' '); 
var loc = 0;
var phrase = titleArray[loc];
loc++;
checkPhrase(phrase);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {	
	youtubeTitle = $('#eow-title').attr("title");
	titleArray = youtubeTitle.split(' '); 
	loc = 0;
	phrase = titleArray[loc];
	loc++;
	window.checkPhrase(phrase);
});

