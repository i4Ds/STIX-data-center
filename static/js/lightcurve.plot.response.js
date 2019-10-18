/*!
 * stix.calibration.response..0.1
 * Author: Hualin Xiao 
 */
MAX_TIME_SPAN=24*7*3600;
$(function() {

	$('#right-buttons').show();
	var pktAna=new StixPacketAnalyzer();
	if(window.startUnix>=0 && window.timeSpanSeconds>=0)
	{

			requestLightCurvePackets(window.startUnix,window.timeSpanSeconds);
	}

	function plotLightCurves(data, start, span)
	{


		var packets=data['data'];
		var energySpectra={};
		var trigRates=[];
		var rcrArray=[];
		var timestamps=[];
		var integrationTime,integrations;
		var detectorMask;
		var pixelMask;
		var numEnergies;
		for (var i=0;i<packets.length;i++)
		{

			var packet=packets[i];
			var parameters=packet['parameters'];
			pktAna.load(packet);
			var startCoarseTime=parameters[1][1][0];
			var startFineTime=parameters[2][1][0];
			integrations=parameters[3][1][0];
			detectorMask=parameters[4][1][0];
			pixelMask=parameters[5][1][0];

			var startUnixTime=StixDateTime.SCET2unixtimestamp(startCoarseTime,startFineTime);

			integrationTime=(integrations+1)*0.1;

			var energies=pktAna.toArray('NIX00270/NIX00271/*',null, engParam='*')[0];
			numEnergies=energies.length;
			var trig=pktAna.toArray('NIX00273/*',null, engParam='*')[0];
			var rcr=pktAna.toArray('NIX00275/*',null, engParam='*')[0];

			if(trig.length!=rcr.length)
			{
				$('#status').html('Invalid light curve data.');
			}
			for (var j=0;j<trig.length;j++)
			{
				timestamps.push(startUnixTime + j* (integrations+1)*0.1);
				trigRates.push(trig[j]);
				rcrArray.push(rcr[j]);

			}

			for (var j=0;j<energies.length;j++)
			{
				energyLC=energies[j];
				if (!(j in energySpectra))
				{
					energySpectra[j]=[];
				}

				for(var k=0;k<energyLC.length;k++)
				{
					energySpectra[j].push(energyLC[k]);
				}
			}




		}
		var timeObj=StixDateTime.resetUnixTimestamp(timestamps);
		var xData=timeObj.time;
		var T0_UTC=timeObj.T0_UTC;
		var T0=timeObj.T0;
		var utcArray=timeObj.hint;
		var startUTC=utcArray[0];
		//var endUTC=hints[hints.length-1];
		var endUTC=utcArray[utcArray.length-1];
		var timeRangeString=startUTC+' - ' + endUTC;
		$('#status').html('Showing data from '+timeRangeString);


		var ylabel='Counts in '+ integrationTime +' s';
		//var xlabel='Time [s] (T0: ' +T0_UTC+')';
		var xlabel='UTC';

		var yData=energySpectra;
		var lcTraces=[];
		numEnergies=energies.length;
		var names=['LC 0 - 10 keV', 'LC 10 - 15 keV' , 'LC 15 - 25 keV','LC 25 - 50 keV' , 'LC 50 - 150 keV'];
		for (var ii=0;ii<5;ii++)
		{
			lcTraces.push({
				x: utcArray,
				y: yData[ii],
				line:{shape:'hvh'},
				name:  names[ii],
				type: 'Scatter+Lines'
			});
		}

		var xAxisConfig={
			title: xlabel,
			titlefont: {
				family: 'Arial, monospace',
				size: 14,
				color: '#7f7f7f'
			}
		};
		var yAxisConfig={
			title: ylabel,
			titlefont: {
				family: 'Arial, monospace',
				size: 14,
				color: '#7f7f7f'
			}
		};

		var plotTitle='QL LC('+ timeRangeString+')';

		var lcLayout = {
			title: {
				text:plotTitle,
				font: {
					family: 'Courier New, monospace',
					size:18 
				},
				xref: 'paper',
				x: 0.05,
			},
			autosize: false,
			width: 900,
			height: 500,
			xaxis: xAxisConfig,
			yaxis: yAxisConfig

		};
	Plotly.newPlot('lightcurves', lcTraces, lcLayout, config=StixCommon.plotlyConfigAllowSharing);

	var trigTrace=[{
				x: utcArray,
				y: trigRates,
				line:{shape:'hvh'},
				type: 'Scatter+Lines'
			}];

	var trigLayout = {
			title: {
				text:'Triggers ('+timeRangeString+')',
				font: {
					family: 'Courier New, monospace',
					size:18 
				},
				xref: 'paper',
				x: 0.05,
			},
			autosize: false,
			width: 900,
			height: 400,
			xaxis: xAxisConfig,
			yaxis: yAxisConfig

		};

		Plotly.newPlot('triggers', trigTrace, trigLayout, config=StixCommon.plotlyConfigAllowSharing);
			var rcrTrace=[{
				x: utcArray,
				y: rcrArray,
				line:{shape:'hvh'},
				type: 'Scatter+Lines'
			}];


		var yAxisConfig={
			title: 'RCR',
			titlefont: {
				family: 'Arial, monospace',
				size: 14,
				color: '#7f7f7f'
			}
		};

	var rcrLayout = {
			title: {
				text:'RCR',
				font: {
					family: 'Courier New, monospace',
					size:18 
				},
				xref: 'paper',
				x: 0.05,
			},
			autosize: false,
			width: 900,
			height: 400,
			xaxis: xAxisConfig,
			yaxis: yAxisConfig

		};

		Plotly.newPlot('rcr', rcrTrace, rcrLayout, config=StixCommon.plotlyConfigAllowSharing);


	}

	$('#previous').click(function(e) {
		e.preventDefault();
		requestLightCurvePackets(window.startUnix-window.timeSpanSeconds, window.timeSpanSeconds);
	});
	$('#next').click(function(e) {
		e.preventDefault();
		requestLightCurvePackets(window.startUnix+window.timeSpanSeconds, window.timeSpanSeconds);
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

			requestLightCurvePackets(start,span);

		}


	});







	function requestLightCurvePackets(start, span)
	{
		if(span>MAX_TIME_SPAN)
		{
			span=MAX_TIME_SPAN;
		}
		$('#status').html('Requesting data from '+StixDateTime.unixTime2ISOstring(start)+
			' to '+StixDateTime.unixTime2ISOstring(start+span));
		var dataForm={
			start_unix:start, //unix_time
			span_seconds:span//seconds
		};
		window.startUnix=start;
		window.timeSpanSeconds=span;
		$.ajax({
			url: '/request/qllc/tw',
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
					plotLightCurves(data,start,span);
					var shareURL='/plot/lightcurves?start='+start+'&span='+span;
					$('#share').attr('href',shareURL);

				}
				else
				{
					$('#status').html('No light curve data in the time window: '+StixDateTime.unixTime2ISOstring(start)+
						' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}


});






