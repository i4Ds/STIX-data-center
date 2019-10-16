$(function() {



	$( "#reqform" ).submit(function( event ) {
		event.preventDefault();
		//ajax request

		var utc=$('#utc-input').val();
		var span=$('#span-input').val();
		var spid=$('#spid-input').val();
		var selValue = $("input[type='radio']:checked").val();
		console.log(spid);
		if (utc==''|| (typeof utc ==='undefined')|| span=='' ||(typeof span ==='undefined'))
		{
			alert('Start time or time span empty!');

		}
		else if(selValue=='SPID' &&spid=='')
		{
			alert('SPID can not be empty!');
		}
		else
		{

			$('#headerTreeView tbody').empty();
			$('#leftloader').show();
			/*
			var formData= JSON.stringify($('#reqform').serializeArray());
			console.log(formData);
			*/
			$('#msg').html('Requesting packets ...');
			$.ajax({
				url: '/request/headers/pid-tw',
				type:"POST",
				dataType:"json",
				data: $("#reqform").serialize(),
				success: function (data) {
					$('#leftloader').hide();
					displayStixHeaders(data);
					
				}

			});
		}


	});




});




