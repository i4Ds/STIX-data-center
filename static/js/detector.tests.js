/*!
 * stix.detector.test.response..0.1
 * Author: Hualin Xiao 
 */
MAX_TIME_SPAN=24*7*3600;
$(function() {

	window.adcPhysical=new Array(32*12).fill(0);
	//window.loadedPackets=data;
	$('#right-buttons').show();

	var detectorTestTable=$('#detector-test-table').DataTable(
		{
			"bPaginate": false,
			"bFilter": false,
			"bInfo": false
		});
	var pktAna=new StixPacketAnalyzer();
	if(window.startUnix>0 && window.timeSpanSeconds>0)
	{

	}
	else if(window.testId>=-1 )
	{
		loadDetectorTestReport(window.testId,0);
	}


	loadPixelData=function(detector_idx, pixel)
	{
		var title='Detector # '+(detector_idx+1);
		var xlabel='Detector channel';
		var ylabel='Value';
		var ydata=[];
		for(var i=0;i<12;i++)
		{
			ydata[i]=window.adcPhysical[(detector_idx)*12+i];
		}

		StixPlot.plot1DArray(ydata, title, xlabel, ylabel, 'histogram', width=700, height=400, 0, 1);

	}
	function loadDetectorTestReport(Id, which=0)
	{
		//which:
		//0 current
		//-1  previous
		//1  next

		var url;
		url='/request/detector/test/'+Id+'/'+which;
		$('#status').html('Requesting detector test data...');
		$.ajax({
			url: url,
			type:"GET",
			dataType:"json",
			success: function (data) {

				//window.loadedPackets=data;
				if(data.length>0)
				{
					displayDetectorTestPackets(data);
				}
				else
				{
					$('#status').html('No detector test run #' +window.testId +' in the database');
				}

			}

		});
	}


	function displayDetectorTestPackets(packets)
	{
		window.adcPhysical=new Array(32*12).fill(0);
		var cdTePixels= [26, 15, 8, 1, 29, 18, 5, 0, 30, 21, 11, 3];
		for(var j =0;j<packets.length;j++)
		{

			var packet=packets[j];
			pktAna.load(packet);
			window.testId=packet._id;
			var result=pktAna.toArray('NIX00104/NIX00100');
			var detectorIds = result[0];
			var  result= pktAna.toArray('NIX00104/NIX00105');
			var  pixelsIds = result[0];
			var selector='NIX00104/NIX00106';
			if (packet.header.SPID==54130) selector = 'NIX00104/NIX00108';
			var  result= pktAna.toArray(selector);
			var  adcs= result[0];
			var det, pix;
			for (var i=0;i<adcs.length;i++)
			{
				det=detectorIds[i];
				pix=pixelsIds[i];
				var idx=cdTePixels.indexOf(pix);
				if (idx==-1)continue;
				window.adcPhysical[(det-1)*12+ idx]=adcs[i];
			
			}
			$('#status').html('Showing '+ packet.header.descr+' received at '+StixDateTime.unixTime2ISOstring(packet.header.unix_time));
		}
				//console.log(adcPhysical);
		StixDetectorView.plotDector('#counts2d', window.adcPhysical);
	}



	$('#previous').click(function(e) {
		e.preventDefault();
		loadDetectorTestReport(window.testId, -1);
	});
	$('#next').click(function(e) {
		e.preventDefault();
		loadDetectorTestReport(window.testId, 1);
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
			requestDetectorTestsList(start,span);

		}
	});

	$( ".last-data" ).click(function( event ) {
		event.preventDefault();
		var spanHours=$(this).val();
		var url='/request/last-packet/timestamp/54124';
		$.getJSON(url, function(data) {
			var lastTime=data['unix_time'];
			if(lastTime>0)
			{
				requestDetectorTestsList(lastTime-spanHours*3600,spanHours*3600, 'Request the data of the last '+spanHours+ ' hours.');
			}
			else{
				$('#status').html('No data in the requested time window');
			}
		});

	});




	function showDetectorTestRuns(data){
		var $table=$('#detector-test-table');
		var ydata=[];
		$('#btn-detector-test-run').show();

		for(var i=0;i<data.length;i++)
		{

			var row=data[i];
			if(row.header.seg_flag == 0 || row.header.seg_flag ==2)continue;
			var tableRows=[ 
				row._id, 
				StixDateTime.unixTime2ISOstring(row.header.unix_time),  
				row.header.descr,
				'<a href="/view/packet/id/'+row._id+'">Show</a></td>',
				'<button class="plot-detector-test" type="button" data-id="'+row._id+'" class="btn btn-link">Plot</button>'
			];
			ydata.push(tableRows);
		}
		detectorTestTable.clear().rows.add(ydata).draw();
		$('#detector-test-run-list').collapse('show');
	}


	$(document).on('click', '.plot-detector-test', function(){ 
		var id=$(this).data('id');
		loadDetectorTestReport(id,0);
		$('#plots').collapse('show');
	});


	function requestDetectorTestsList(start, span, msg='')
	{
		if(span>MAX_TIME_SPAN)
		{
			span=MAX_TIME_SPAN;
		}
		if(msg=='')
		{
			$('#status').html('Requesting data from '+StixDateTime.unixTime2ISOstring(start)+
				' to '+StixDateTime.unixTime2ISOstring(start+span));
		}
		else
		{
			$('#status').html(msg);
		}
		var dataForm={
			start_unix:start, //unix_time
			span_seconds:span//seconds
		};
		window.startUnix=start;
		window.timeSpanSeconds=span;

		$.ajax({
			url: '/request/detector/tests/tw',
			type:"POST",
			dataType:"json",
			data:dataForm ,
			success: function (data) {
				if(data['status']!='OK')
				{
					$('#status').html(data['status']);
				}
				if(data['data'].length>0)
				{
					$('#status').html('Number of detector tests in the request time window :'+data['data'].length)
					showDetectorTestRuns(data['data']);
				}
				else
				{
					$('#status').html('No detector test reports in the time window: '+StixDateTime.unixTime2ISOstring(start)+
						' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}






});






