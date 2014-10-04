$( document ).ready(function() {
	$("#tabs").tabs();

	$.getJSON("/refresh", function(data) {
		for (var i = 0;i<data['updates'].length;i++) {
			if (data['updates'][i][3] === false) {
				$(".updates").append("<li><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a><br /><div class='old'>"+data['updates'][i][1]+"</div>   ->   <div class='new'>"+data['updates'][i][2]+"</div><br /><a class='update' href='/update/"+data['updates'][i][0]+"'>update</a></li>");
			} else {
				$(".updates").append("<li class='warn'><a class='name' href='https://pypi.python.org/pypi/"+data['updates'][i][0]+"/' target='_blank'>"+data['updates'][i][0]+"</a><br /><div class='old'>"+data['updates'][i][1]+"</div>   ->   <div class='new'>"+data['updates'][i][2]+"</div><br /><a class='warn-update' href='/update/"+data['updates'][i][0]+"'>update</a></li>");
			}
		}
		for (var i = 0;i<data['installed'].length;i++) {
			if (data['installed'][i][2] === false) {
				$(".installed").append("<li><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a><br />current: "+data['installed'][i][1]+"</li>");
			} else {
				$(".installed").append("<li class='warn'><a class='name' href='https://pypi.python.org/pypi/"+data['installed'][i][0]+"/' target='_blank'>"+data['installed'][i][0]+"</a><br />current: "+data['installed'][i][1]+"</li>");
			}
		}
	});

	$(document).on("click", 'a.update', function(event) {
		event.preventDefault();
		console.log("weee");
	})

	$(document).on("click", 'a.update-warn', function(event) {
		event.preventDefault();
		console.log("weee");
	})
});