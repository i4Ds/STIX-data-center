/*!
 * stix.calibration.response..0.1
 * Author: Hualin Xiao 
 */
MAX_TIME_SPAN=24*7*3600;
$(function() {

	window.calibratinRunInfo=null;
	$('#right-buttons').show();
	var calTable=$('#calibration-runs-table').DataTable(
		{
			"bPaginate": false,
			"bFilter": false,
			"bInfo": false
		});
	var pktAna=new StixPacketAnalyzer();
	if(window.startUnix>0 && window.timeSpanSeconds>0)
	{

	}
	else if(window.calibrationId>=-1)
	{
		loadCalibrationRun(window.calibrationId);
	}



	function loadCalibrationRun(Id)
	{

		var url;
		if (Id==-1)
		{
			url='/request/calibration/info';
		}
		else{
			url='/request/calibration/info/'+Id;
		}
		$('#status').html('Requesting calibration data...');
		$.ajax({
			url: url,
			type:"GET",
			dataType:"json",
			success: function (data) {
				if(data.length>0)
				{
					showConfiguration(data[0]);
					plotCountMap(data[0],'counts2d');
					window.calibratinRunInfo=data[0];
					window.calibrationId=data[0]._id;


				}
				else
				{
					$('#status').html('No calibration run #' +window.calibrationId +' in the database');
				}

			}

		});
	}
	function showConfiguration(data)
	{

		var $tableRunInfo=$('#calibration-run-info');
		$tableRunInfo.show();
		$tableRunInfo.empty();
		var liveTime=data.auxiliary[4][1]/1000;
		$tableRunInfo.append( '<tr> <td> Run #'+data._id+' </td><td >'+
			' <p class="font-weight-bolder"> Start time </p></td> <td>'+ 
			StixDateTime.unixTime2ISOstring(data.start_unix_time) +'</td>'+
			'<td> <p class="font-weight-bolder"> Duration (s)</p>  </td> <td>'+ 
			data.duration +'</td><td><p class="font-weight-bolder">Quiet time</p></td>'+
			' <td>'+data.auxiliary[3][1]+'</td> <td>'+
			'<p class="font-weight-bolder">Live time (s)<p></td>'+
			' <td>'+liveTime+'</td><td><p class="font-weight-bolder">Detector mask </p></td>'+
			' <td>'+StixCommon.toHex(data.auxiliary[10][1])+'</td> <td><p class="font-weight-bolder">Pixel mask </p>'+
			'</td> <td>'+StixCommon.toHex(data.auxiliary[12][1])+'</td><td> <a href="/view/packet/calibration/'+data._id+'">  Packets'+
			'</a> </td> </tr>');
		$('#share').attr('href','/plot/calibration/'+data._id);
		$('#status').html('Showing calibration run # '+data._id);

	}
	function plotCountMap(data, div)
	{
		var totalCounts=data.total_counts;
		var x=[];
		var y=[];
		var z=[];
		for(var i=0; i<totalCounts.length;i++)
		{
			//the first element is the packet id
			x.push(totalCounts[i][1]);
			y.push(totalCounts[i][2]);
			z.push(totalCounts[i][3]);
		}
		var trace={
			name:'Counts of pixels',
			type:'heatmap',
			x:x,
			y:y,
			z:z,
			autobinx:true,
			autobiny:true,
			xgap : 2,
			ygap: 1,
			colorscale: StixCommon.viridis
		}
		var pdata=[trace];
		var layout={
			title: 'Total counts (decompressed) ', 
			xaxis: {
				title:'Detector #',
				range: [0,32], 
				autorange: true
			}, 
			yaxis: {
				title:'Pixel #',
				range: [0, 12], 
				autorange: true
			}, 
			zaxis: {
				title:'Counts' 
			}, 
			hovermode:'closest',

			autosize: true


		};

		var myPlot = document.getElementById(div);
		Plotly.newPlot(div, pdata, layout, StixCommon.plotlyConfig);
		myPlot.on('plotly_click', function(data){
			var pts = '';
			var detector, pixel;
			for(var i=0; i < data.points.length; i++){
				detector=data.points[i].x ;
				pixel=data.points[i].y ;
			}
			loadCalibrationSpectrum(detector, pixel);
		});	

	}

	function loadCalibrationSpectrum(detector, pixel)
	{
		if(window.calibratinRunInfo==null)
		{
			return;
		}

		var totalCounts=window.calibratinRunInfo.total_counts;
		var packetId;
		for(var i=0; i<totalCounts.length;i++)
		{
			//the first element is the packet id
			if((totalCounts[i][1])==detector && totalCounts[i][2] == pixel)
			{
				packetId=totalCounts[i][0];
				break;
			}
		}
		$.ajax({
			type:"GET",
			url:"/request/packet/id/"+packetId, 
			dataType:"json",
			success: function (data) {

				if(data.length>0)
				{
					var packet=data[0];

					plotCalibrationSpectrum(detector, pixel, packet);
				}
				else
				{
					$('#status').html("The packet was found in the database");

				}


			}
		});

	}
	function plotCalibrationSpectrum(detector, pixel, packet)
	{
		pktAna.load(packet);
		var result=pktAna.toArray('NIX00159/NIXD0155');
		var detectorIds = result[0];
		var  result= pktAna.toArray('NIX00159/NIXD0156');
		var  pixelsIds = result[0];
		var  result= pktAna.toArray('NIX00159/NIX00146/*',null, engParam='*');
		var  spectra = result[0];
		var det, pix;
		for (var i=0;i<spectra.length;i++)
		{
			det=detectorIds[i];
			pix=pixelsIds[i];
			if(det==detector && pixel==pix)
			{
				var title='Energy spectrum (Detector  '+(det+1)+' Pixel  '+pix+')';
				var xlabel='Energy channel';
				var ylabel='Counts';
				var ydata=spectra[i];
				var div='spectrum';
				StixPlot.plot1DArray(ydata, title, xlabel, ylabel, div, width=700, height=400, 0, 1);
				break;

			}
		}


	}

	$('#previous').click(function(e) {
		e.preventDefault();
		loadCalibrationRun(window.calibrationId-1);
	});
	$('#next').click(function(e) {
		e.preventDefault();
		loadCalibrationRun(window.calibrationId+1);
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
			requestCalibrationRunList(start,span);

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
				requestCalibrationRunList(lastTime-spanHours*3600,spanHours*3600, 'Request the data of the last '+spanHours+ ' hours.');
			}
			else{
				$('#status').html('No data in the requested time window');
			}
		});

	});




	function showCalibrationRunList(data){
		var $table=$('#calibration-runs-table');
		var ydata=[];
		$('#btn-calibration-run').show();
		int lastCalibrationID=-1;
		for(var i=0;i<data.length;i++)
		{

			var row=data[i];
			var tableRows=[ 
				row._id , 
				StixDateTime.unixTime2ISOstring(row.header_unix_time),  
				StixDateTime.unixTime2ISOstring(row.start_unix_time), 
				row.duration, 
				'<a href="/view/packet/calibration/'+row._id+'">Show</a></td>',
				'<button class="plot-calibration" type="button" data-id="'+row._id+'" class="btn btn-link">Plot</button>'
				lastCalibrationID=row._id;
			];
			ydata.push(tableRows);
		}
		calTable.clear().rows.add(ydata).draw();
		$('#calibration-run-list').collapse('show');
		if(lastCalibrationID>=0){
			loadCalibrationRun(lastCalibrationID);
		}

	}


	$(document).on('click', '.plot-calibration', function(){ 
		var id=$(this).data('id');
		loadCalibrationRun(id);
		$('#plots').collapse('show');
	});


	function requestCalibrationRunList(start, span, msg='')
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
			url: '/request/calibration/runs/tw',
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
					$('#status').html('Number of calibration runs in the request time window :'+data['data'].length)
					showCalibrationRunList(data['data']);

				}
				else
				{
					$('#status').html('No calibration in the time window: '+StixDateTime.unixTime2ISOstring(start)+
						' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}


});






