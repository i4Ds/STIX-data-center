/*!
 * stix.calibration.response..0.1
 * Author: Hualin Xiao 
 * Last updated date: March 23, 2020
 */
$(function() {
	MAX_TIME_SPAN=24*7*3600;
	window.calibratinRunInfo=null;
	window.currentSpectrumId=0;
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
		//do nothing

	}
	else if(window.calibrationId>=-1)
	{
		loadCalibrationRun(window.calibrationId);
	}
	if(window.fileID>-1)
	{
		requestCalibrationRunListOfFile(window.fileID);
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
					addCalibrationInfo(data[0]);
					window.calibratinRunInfo=data[0];
					plotCountMap(0);
					window.calibrationId=data[0]._id;
					$('#download').show();

				}
				else
				{
					$('#status').html('No calibration run #' +window.calibrationId +' in the database');
				}

			}

		});
	}
	function addCalibrationInfo(data)
	{

		var $tableRunInfo=$('#table-calibration-run-info');
		$tableRunInfo.show();
		$tableRunInfo.empty();
		var liveTime=data.auxiliary[4][1]/1000;
		$('#cal-info-title').html('Calibration run '+data._id);
		var formats=data['sbspec_formats'];
		var sbspecStatus=data['sbspec_status'];
		var tableRows=[
			['Start UTC', StixDateTime.unixTime2ISOstring(data.start_unix_time)],
			['Duration ', data.duration +' s'],
			['Quiet time ', parseInt(data.auxiliary[3][1])/62.5+' ms'],
			['Live time ', liveTime+ ' s'],
			['Detector mask',StixCommon.toHex(data.auxiliary[10][1])],
			['Pixel mask' ,StixCommon.toHex(data.auxiliary[12][1])],
			['sbspec mask' ,StixCommon.toHex(data.auxiliary[13][1])],
		];
		if(formats && sbspecStatus){
			for (var i=0;i<8;i++){
				if(sbspecStatus[i]){
				var startX=formats[i][2];
				var numPoints=formats[i][0];
				var binWidth=formats[i][1]+1;
				var endX=(numPoints+1)*binWidth+startX;
				tableRows.push(['sbspec '+i,  '['+startX +','+endX+']  step= '+binWidth]);
				}


			}
		}
		var tbLen=tableRows.length;
		for(var i=0;i< tbLen;i++)
		{
			var label=tableRows[i][0];
			var content=tableRows[i][1];
			$tableRunInfo.append('<tr><td class="text-info text-center" width="35%">'+ label+'</td><td><span class="text-secondary">' +content+ '</span></td></tr>');
		}

		$('#share').attr('href','/plot/calibration/'+data._id);
		var msg='Showing calibration run # '+data._id +'; Subspectrum '+ window.currentSpectrumId+
			',  Starts at '+StixDateTime.unixTime2ISOstring(data.start_unix_time) +', duration: '+ data.duration +' s' ;
		$('#status').html(msg);
		$("#packet").prop("href",'/view/packet/calibration/'+data._id);
		$("#packet").show();

	}
	function plotCountMap(specId)
	{
		//console.log(window.calibratinRunInfo);

		//This following 4 lines should be removed in the future
		var data=window.calibratinRunInfo;
		var totalCounts=data.total_counts;
		if(Array.isArray(totalCounts)){
			plotCountMapLegacy(totalCounts);
			return;
		}
		window.currentSpectrumId=specId;

		if(data==null)return;
		var sbspecCounts=data.sbspec_counts_sum;
		var counts=data.counts[specId];
		StixDetectorView.plotDector('#counts2d', counts, sbspecCounts);


	}

	function plotCountMapLegacy(totalCounts){
		//should be removed in the future
		var x=[];
		var y=[];
		var z=[];
		var counts=new Array(32*12).fill(0);
		var len=totalCounts.length;

		for(var i=0; i<len;i++)
		{
			//the first element is the packet id
			var det=totalCounts[i][1];
			var pixel=totalCounts[i][2];
			var ncounts=totalCounts[i][3];
			counts[det*12+pixel]=ncounts;
		}
		StixDetectorView.plotDector('#counts2d', counts);
	}


	var loadCalibrationSpectrum=function(detector, pixel)
	{
		var data=window.calibratinRunInfo;
		if(data==null)return;

		//the following 4 lines should be removed  in the future
		var totalCounts=data.total_counts;
		if(Array.isArray(totalCounts)){
			loadCalibrationSpectrumLegacy(detector, pixel, totalCounts);
			return;
		}

		var specId=window.currentSpectrumId;
		var packetId=data.packet_index[specId][detector*12+pixel];
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
	var loadCalibrationSpectrumLegacy=function(detector, pixel, totalCounts)
	{
		var packetId;
		var totLen=totalCounts.length;
		for(var i=0; i<totLen;i++)
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
		result= pktAna.toArray('NIX00159/NIXD0156');
		var  pixelsIds = result[0];

		var sbSpecIds=pktAna.toArray('NIX00159/NIXD0157')[0];
		result= pktAna.toArray('NIX00159/NIX00146/*',null, engParam='*');
		var  spectra = result[0];
		if(!Array.isArray(spectra))return;

		var subspec= pktAna.toArray('NIX00159/NIXD0157');


		var det, pix;

		var data=window.calibratinRunInfo;
		var startX=0;
		var binWidth=1;
		var currentSbSpecID=window.currentSpectrumId;
		var formats=data.sbspec_formats;
		if (formats){
			startX=formats[currentSbSpecID][2];
			binWidth=formats[currentSbSpecID][1]+1;
		}
		var len=spectra.length;
		for (var i=0;i<len;i++)
		{
			det=detectorIds[i];
			pix=pixelsIds[i];
			sbSpecId=sbSpecIds[i];
			if(det==detector && pixel==pix && sbSpecId==window.currentSpectrumId)
			{
				var title='Calibration spectrum (Detector '+(det+1)+', Pixel '+pix+', Sbspec '+sbSpecId+')';
				var xlabel='ADC channel';
				var ylabel='Counts';
				var ydata=spectra[i];
				var div='spectrum';

				StixPlot.plot1DArray(ydata, title, xlabel, ylabel, div, width=700, height=400, x0=startX, binw=binWidth);
				break;

			}
		}


	}
	loadPixelData=loadCalibrationSpectrum;
	plotCounts=plotCountMap;


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
		var lastID=-1;
		var len=data.length;
		for(var i=0;i<len;i++)
		{

			var row=data[i];
			var tableRows=[ 
				row._id , 
				StixDateTime.unixTime2ISOstring(row.header_unix_time),  
				StixDateTime.unixTime2ISOstring(row.start_unix_time), 
				row.duration, 
				'<a  class="badge badge-success" href="/view/packet/calibration/'+row._id+'"> <i class="fas fa-list"></i>  </a>',
				'<a class="badge badge-success plot-calibration"  href="#" data-id="'+row._id+'" > <i class="fas fa-chart-line"></i> </a>'
			];
			lastID=row._id;
			ydata.push(tableRows);
		}
		calTable.clear().rows.add(ydata).draw();
		$('#calibration-run-list').collapse('show');
		if(lastID>=0)loadCalibrationRun(lastID);
	}


	$(document).on('click', '.plot-calibration', function(e){ 

		e.preventDefault();
		var id=$(this).data('id');
		loadCalibrationRun(id);
		$('#plots').collapse('show');
	});


	function requestCalibrationRunList(start, span, msg)
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


	function requestCalibrationRunListOfFile(fileID)
	{
		$('#status').html('Showing calibration runs in file #'+fileID); 

		var URL="/request/calibration/runs/file/"+fileID;
		$.ajax({
			url: URL,
			dataType:"json",
			success: function (data) {
				if(data.length>0)
				{
					$('#status').html('Number of calibration runs in the file #:'+fileID);
					showCalibrationRunList(data);

				}
				else
				{
					$('#status').html('No calibration in the file #'+fileID);
				}

			}

		});

	}


	$('#download').on('click', function(e){
		e.preventDefault();
		$('#status').html('Requesting spectrum data from server');
		var URL="/request/calibration/spectra/"+window.calibrationId;
		$.ajax({
			url: URL,
			dataType:"json",
			success: function (data) {
				if(data.length>0){
					var spectra=data[0]['spectra'];
					if (spectra!=null && spectra!=undefined){
						StixCommon.downloadArrayAsCSV('calibration_run_'+window.calibrationId+'.csv', spectra);
						$('#status').html('');
					}
					else{
						$('#status').html('Requested spectra not available');
					}
				}
			}

		});
	});
	$("#show-modal").click(function(){
		$("#cal-info-modal").modal();
	});


});









