$(document).ready(function() {
	$("#tabs").tabs();
	$("#tabs").children("ul").append("<li class='refresh'><a class='refresh'><img class='refresh' src='/static/images/refresh.svg' height='25px' width='25px' /></a></li>")

	var refresh = function() {
		var availupdates = [];
		// disable update all button
		$(document).off('click', 'a.refresh');
		// should also do a overlay over the update and installed pages...
		$('a.refresh').children('img').attr('id', 'rotating');
		$('#tabs-1').children('a.updateall').after("<img id='rotating' class='refresh' src='/static/images/refresh.svg' style='width: 250px; height: 250px; cursor: default;'>")
		$('#tabs-2').append("<img id='rotating' class='refresh' src='/static/images/refresh.svg' style='width: 250px; height: 250px; cursor: default;'>")
		$.getJSON("/refresh", function(data) {
			for (var i = 0;i<data['updates'].length;i++) {
				if (data['updates'][i][3] === false) {
					$(".updates").append("<li><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a><br /><div class='old'>"+data['updates'][i][1]+"</div>   →   <div class='new'>"+data['updates'][i][2]+"</div><br /><a class='update' id='"+data['updates'][i][0]+"' href='/update/"+data['updates'][i][0]+"=="+data['updates'][i][2]+"'>update</a></li>");
				} else {
					$(".updates").append("<li class='warn'><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a><br /><div class='old'>"+data['updates'][i][1]+"</div>   →   <div class='new'>"+data['updates'][i][2]+"</div><br /><a class='warn-update' id='"+data['updates'][i][0]+"' href='/update/"+data['updates'][i][0]+"=="+data['updates'][i][2]+"'>update</a></li>");
				}
				availupdates.push(data['updates'][i][0])
			}
			for (var i = 0;i<data['installed'].length;i++) {
				if (data['installed'][i][2] === false) {
					$(".installed").append("<li id='"+data['installed'][i][0]+"'><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a><br /><div class='version'>"+data['installed'][i][1]+"</div></li>");
				} else {
					$(".installed").append("<li class='warn' id='"+data['installed'][i][0]+"'><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a><br /><div class='version'>"+data['installed'][i][1]+"</div></li>");
				}
			}
			// re-enable updateall if its been turned off!
			$(document).on("click", 'a.refresh', function(event) {
				event.preventDefault();
				$('ul.updates').children().remove();
				$('ul.installed').children().remove();
				avail = refresh();
			});
			$('a.refresh').children('img').removeAttr('id');
			$('#tabs-1').children('img#rotating').remove()
			$('#tabs-2').children('img#rotating').remove()
		});
		return availupdates;
	}

	// disable updateall button
	var updates = refresh();

	// should implement a thing to check if you want to update if its a major version change!
	$(document).on("click", 'a.update', function(event) {
		event.preventDefault();
		// maybe give it some updating typing logo/thing and also disable it so you cant click twice
		$.post(event.target.href, function(data) {
			if (data === "") {
				// remove the div, should also update the installed list somehow, maybe change the color to indicate its been updated... (give each li a id/class with the name of the package.)
				$('li#'+event.target.href.split('/').slice(-1)[0].split("==")[0]).children('.version').text(event.target.href.split("==")[1]);
				$('li#'+event.target.href.split('/').slice(-1)[0].split("==")[0]).css('background-color', '#85C57C');
				$(event.target).parent().remove();
			} else {
				// ERRORRRR
			}
		});
	});

	$(document).on("click", 'a.update-warn', function(event) {
		event.preventDefault();
		console.log("weee");
	})

	$(document).on("click", 'a.updateall', function(event) {
		event.preventDefault();
		// some way to check for warning about dev packages
		$(document).off('click', 'a.updateall');
		$(document).off('click', 'a.update');
		$(document).off('click', 'a.update-warn');
		$(document).off('click', 'a.refresh');
		$.post('/update', function(data) {
			if (data['passes']) {
				for (var i = 0;i<data['passes'].length;i++) {
					$('li#'+data['passes'][i]['name']).children('.version').text(data['passes'][i]['version']);
					$('li#'+data['passes'][i]['name']).css('background-color', '#85C57C');
					$(event.target).parent().remove();
				}
			}
			if (data['errors']) {
				for (var i = 0;i<data['errors'].length;i++) {
					// ERRORRRR, turn back on the update buttons and show a modal with error messages in pre code blocks? (syntax highlighting YAY)
					
				}
			}
		});
	});
});