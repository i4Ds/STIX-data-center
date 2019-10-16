/*!
 * stix.housekeeping.response..0.1
 * Author: Hualin Xiao 
 */
var MAX_TIME_SPAN=24*3600;
$(function() {

	if(window.startUnix>0 && window.timeSpanSeconds>0)
	{

		ajaxHousekeepingRequest(window.startUnix,window.timeSpanSeconds);

	}
	else if(fileId>=0)
	{
		var url='/request/packets/file/'+fileId+'/hk';

		$('#status').html('Requesting data...');
		$.ajax({
			url: url,
			type:"GET",
			dataType:"json",
			success: function (data) {
				if(data['packets'].length>0)
				{
					$('#status').html('Number of packet:'+data['packets'].length)
					analyzeHousekeeping(data);
					$('#right-buttons').show();

				}
				else
				{
					$('#status').html('No packet in the file #' +fileId);
				}

			}

		});



	}

	function ajaxHousekeepingRequest(start, span)
	{
		if(span>MAX_TIME_SPAN)
		{
			span=MAX_TIME_SPAN;
		}
		$('#status').html('Requesting data from '+StixDateTime.unixTime2ISOstring(start)+' to '+StixDateTime.unixTime2ISOstring(start+span));
		var dataForm={
			start_unix:start, //unix_time
			span_seconds:span//seconds
		};
		window.startUnix=start;
		window.timeSpanSeconds=span;


		$.ajax({
			url: '/request/packets/type-tw/hk',
			type:"POST",
			dataType:"json",
			data:dataForm ,
			success: function (data) {
				if(data['packets'].length>0)
				{
					$('#status').html('Number of packet:'+data['packets'].length)
					analyzeHousekeeping(data);
					$('#right-buttons').show();

				}
				else
				{
					$('#status').html('No data in the time window: '+StixDateTime.unixTime2ISOstring(start)+' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}

	$( "#reqform" ).submit(function( event ) {
		event.preventDefault();
		var utc=$('#utc-input').val();
		var spanMin=$('#span-input').val();

		if (utc==''|| (typeof utc ==='undefined')|| spanMin=='' ||(typeof spanMin ==='undefined'))
		{
			$('#status').html('Invalid request. Start time or time span empty!');
		}
		else
		{
			var start=StixDateTime.utc2unix(utc);
			var span=Number(spanMin)*60;

			ajaxHousekeepingRequest(start,span);

		}


	});

	$('#previous').click(function(e) {
		e.preventDefault();

		
		ajaxHousekeepingRequest(window.startUnix-window.timeSpanSeconds, window.timeSpanSeconds);
	});

	$('#next').click(function(e) {
		e.preventDefault();
		ajaxHousekeepingRequest(window.startUnix+window.timeSpanSeconds, window.timeSpanSeconds);
	});

	$("#share").on('click',function(e){
		e.preventDefault();
		var href= $('#share').prop('href');
		var $temp = $("<input>");
		$("body").append($temp);
		$temp.val(href).select();
		document.execCommand("copy");
		$temp.remove();
		alert('The URL has been copied to your clipboard!');

	});


});




