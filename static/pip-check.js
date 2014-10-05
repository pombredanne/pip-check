$(document).ready(function() {
	$("#tabs").tabs();
	$("#tabs").children("ul").append("<li class='refresh'><a class='refresh'><img class='refresh' alt='refreshing package list' src='/static/images/refresh.svg' height='25px' width='25px' /></a></li>");

	var refresh = function() {
		var availupdates = [];
		// disable update all button
		$(document).off('click', 'a.updateall');
		$(document).off('click', 'a.refresh');
		// should also do a overlay over the update and installed pages...
		$('a.refresh').children('img').attr('id', 'rotating');
		$('#tabs-1').children('a.updateall').after("<img id='rotating' class='refresh' src='/static/images/refresh.svg' style='width: 250px; height: 250px; cursor: default;'>");
		$('#tabs-2').append("<img id='rotating' class='refresh' src='/static/images/refresh.svg' style='width: 250px; height: 250px; cursor: default;'>");
		$('a.updateall').css("color", "grey");
		$.getJSON("/refresh", function(data) {
			for (var i = 0;i<data['updates'].length;i++) {
				if (data['updates'][i][3] === false) {
					$(".updates").append("<li><div class='list-wrap'><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a></div><div class='list-wrap'><div class='old'>"+data['updates'][i][1]+"</div>   →   <div class='new'>"+data['updates'][i][2]+"</div></div><div class='list-wrap'><a class='update' id='"+data['updates'][i][0]+"' href='/update/"+data['updates'][i][0]+"=="+data['updates'][i][2]+"'>update</a></div></li>");
					$(document).on("click", 'a.update#'+data['updates'][i][0], function(event) {
						event.preventDefault();
						update(event.target.href.split('/').slice(-1)[0].split("==")[0], event);
					});
				} else {
					$(".updates").append("<li class='warn'><div class='list-wrap'><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a></div><div class='list-wrap'>><div class='old'>"+data['updates'][i][1]+"</div>   →   <div class='new'>"+data['updates'][i][2]+"</div></div><div class='list-wrap'><a class='warn-update' id='"+data['updates'][i][0]+"' href='/update/"+data['updates'][i][0]+"=="+data['updates'][i][2]+"'>update</a></div></li>");
					$(document).on("click", 'a.update#'+data['updates'][i][0], function(event) {
						event.preventDefault();
						update(event.target.href.split('/').slice(-1)[0].split("==")[0], event);
					});
				}
				availupdates.push(data['updates'][i][0])
			}
			for (var i = 0;i<data['installed'].length;i++) {
				if (data['installed'][i][2] === false) {
					$(".installed").append("<li id='"+data['installed'][i][0]+"'><div class='list-wrap2'><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a></div><div class='list-wrap2'><div class='version'>"+data['installed'][i][1]+"</div></div></li>");
				} else {
					$(".installed").append("<li class='warn' id='"+data['installed'][i][0]+"'><div class='list-wrap2'><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a></div><div class='list-wrap'><div class='version'>"+data['installed'][i][1]+"</div></div></li>");
				}
			}
			// re-enable refresh button
			$(document).on("click", 'a.refresh', function(event) {
				event.preventDefault();
				$('ul.updates').children().remove();
				$('ul.installed').children().remove();
				$('.ui-dialog').remove();
				avail = refresh();
			});
			$(document).on("click", 'a.updateall', function(event) {
				event.preventDefault();
				updateAll();
			});
			$('a.refresh').children('img').removeAttr('id');
			$('#tabs-1').children('img#rotating').remove();
			$('#tabs-2').children('img#rotating').remove();
			$('a.updateall').css('color', 'rgb(83, 151, 83)');
		});
		return availupdates;
	}

	var update = function(pkg, event, turnON) {
		$(document).off('click', 'a.update#'+pkg)
		$.post(event.target.href, function(data) {
			if (data === "") {
				console.log(event.target.href.split("==")[1]);
				$('li#'+pkg).children('.list-wrap2').children('.version').text(event.target.href.split("==")[1]);
				$('li#'+pkg).css('background-color', '#85C57C');
				$(event.target).parent().parent().remove();
			} else {
				// ERRORRRR
				loaded = JSON.parse(data);
				$(event.target).attr('href', "#error-"+pkg);
				$(event.target).attr('class', 'error'); 
				$(event.target).text('error');
				$(event.target).css('color', 'rgb(216, 85, 85)');
				$(event.target).parent().parent().css('background-color', 'rgb(255, 194, 194)');
				// add error log modal...
				$(event.target).parent().append("<div class='error-msg' id='"+pkg+"'><pre class='language-bash'><code>"+loaded['error'].replace("\n", "<br />")+"</code></pre>");
				$('.error-msg#'+pkg).dialog({
					autoOpen: false,
					resizeable: false,
					draggable: false,
					modal: true
				});
				$(document).on('click', 'a.error#'+pkg, function(event) {
					$('.error-msg#'+pkg).dialog('open');
				});
			}
			if (turnON) {
				$(document).on("click", 'a.refresh', function(event) {
					event.preventDefault();
					$('ul.updates').children().remove();
					$('ul.installed').children().remove();
					$('.ui-dialog').remove();
					avail = refresh();
				});
				$('a.updateall').css('color', 'rgb(83, 151, 83)');
				$(document).on("click", 'a.updateall', function(event) {
					event.preventDefault();
					updateAll();
				});
			}
		});
		$(event.target).removeAttr('href');
	}

	var updateAll = function() {
		// disable stuff to stop people messing around
		$(document).off('click', 'a.updateall');
		$('a.updateall').css("color", "grey");
		$(document).off('click', 'a.refresh');
		for (var i=0;i<$('ul.updates').children().length;i++) {
			pkg = $($('ul.updates').children()[i]).find('a.name').text();
			if (i === $('ul.updates').children().length-1) {
				update(pkg, {'target': $('a.update#'+pkg)[0]}, true);
			} else {
				update(pkg, {'target': $('a.update#'+pkg)[0]});
			}
		}
	}

	// initial info
	var stuff = refresh();

	$(document).on("click", 'a.update-warn', function(event) {
		event.preventDefault();
		console.log("weee");
	});
});