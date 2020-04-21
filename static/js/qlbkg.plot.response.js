/*!
 * lightcurve.plot.response..0.1
 * Author: Hualin Xiao 
 */
MAX_TIME_SPAN=24*7*3600;
$(function() {

	$('#right-buttons').show();
	var pktAna=new StixPacketAnalyzer();
	window.lightcurveData={};
	if(window.startUnix>0 && window.timeSpanSeconds>0)
	{
		//Request from URL
		requestBackgroundPackets(window.startUnix,window.timeSpanSeconds);
	}
	else if(window.run>=0)
	{
		requestBackgroundPacketsOfRun(window.run);
	}
	else if(window.startUnix==0 && window.timeSpanSeconds==0)
	{
		//No request from URL, load the last 4 hours' by default
		loadLastLigthCurves(3600*4);
		
	}


	window.currentXaxisType=0;
	window.currentLogy=false;


	function getBackgroundData(data, start, span)
	{

		var lightcurve={};
		var packets=data['data'];
		lightcurve.energySpectra={};
		lightcurve.trigRates=[];
		//window.lightcurveData.unixTimestamps=[];
		lightcurve.scTimestamps=[];

		lightcurve.integrationTime=0;
		var integrations=0;

		for (var i=0;i<packets.length;i++)
		{

			var packet=packets[i];
			var parameters=packet['parameters'];
			pktAna.load(packet);
			var startCoarseTime=parameters[1][1];
			var startFineTime=parameters[2][1];
			integrations=parameters[3][1];

			var startSCET=startCoarseTime+startFineTime/65536.;
			var	dataStartUnixTime=StixDateTime.SCET2Unixtime(startSCET);

			lightcurve.integrationTime=(integrations+1)*0.1;

			var energies=pktAna.toArray('NIX00270/NIX00277/*',null, engParam='*')[0];
			var trig=pktAna.toArray('NIX00273/*',null, engParam='*')[0];

			var unixTime;
			for (var j=0;j<trig.length;j++)
			{
				unixTime=dataStartUnixTime+ j* (integrations+1)*0.1;

				if(start!=0&&span!=0)
				{
					//not default
					if(unixTime<start)continue;
					if(unixTime>start+span)break;
				}
				//window.lightcurveData.unixTimestamps.push(startUnixTime + j* (integrations+1)*0.1);
				lightcurve.scTimestamps.push(startSCET+ j* (integrations+1)*0.1);
				lightcurve.trigRates.push(trig[j]);

			}

			for (var j=0;j<energies.length;j++)
			{
				energyLC=energies[j];
				if (!(j in lightcurve.energySpectra))
				{
					lightcurve.energySpectra[j]=[];
				}

				for(var k=0;k<energyLC.length;k++)
				{
					unixTime=dataStartUnixTime+ k* (integrations+1)*0.1;
					if(start!=0&&span!=0)
					{
						if(unixTime<start)continue;
						if(unixTime>start+span)break;
					}
					lightcurve.energySpectra[j].push(energyLC[k]);
				}
			}
		}
		if(start==0&&span==0)
		{
			window.startUnix=dataStartUnixTime;
			window.timeSpanSeconds=unixTime-dataStartUnixTime;
		}


		return lightcurve;
	}

	function plotBackground(data,xaxisType, logy=false)
	{

		if(StixCommon.isObjectEmpty(data))
		{
			return;
		}


		if(data.scTimestamps.length==0)
		{
			$('#status').html('No data in the requested time window:  '+StixDateTime.unixTime2ISOstring(window.startUnix)+ " - "+
				StixDateTime.unixTime2ISOstring(window.startUnix+window.timeSpanSeconds));
			return;
		}

		var startUnixTime=StixDateTime.SCET2Unixtime(data.scTimestamps[0]);
		var length=data.scTimestamps.length;
		var endUnix=StixDateTime.SCET2Unixtime(data.scTimestamps[length-1]);



		var startUTC=StixDateTime.unixTime2ISOstring(startUnixTime);
		var endUTC=StixDateTime.unixTime2ISOstring(endUnix);


		var xlabel;
		var yData=data.energySpectra;

		switch(xaxisType){
			case 0:
				xlabel="UTC";
				timeArray=StixDateTime.SCETArray2ISOStringArray(data.scTimestamps);
				break;
			case 1:
				timeArray=StixDateTime.SCETArray2UnixTimeArray(data.scTimestamps, startUnixTime);
				xlabel="T - T0 (s) [T0: "+startUTC+"]";
				break;
			case 2:
				xlabel="SCET (s) [T0: "+startUTC+"]";
				timeArray=data.scTimestamps;
				break;
		}

	
		var timeRangeString=startUTC+' to ' + endUTC;
		var dataInfo=timeRangeString;
		if(window.run>=0){
			dataInfo+='  (File #'+window.run +')';
		}
		$('#status').html('Showing data from '+dataInfo);

		var ylabel='Counts in '+ data.integrationTime +' s';




		//var lcTraces=[];
		var allTraces=[];

		var lcTraces=[];
		var trigTrace=[];

		var names=['4 - 10 keV', '10 - 15 keV' , '15 - 25 keV','25 - 50 keV' , '50 - 150 keV'];
		for (var ii=0;ii<5;ii++)
		{
			lcTraces.push({
				x: timeArray,
				y: yData[ii],
				line:{shape:'hvh'},
				name:  names[ii],
				type: 'Scatter+Lines'
			});
		}
		trigTrace=[{x: timeArray,	y: data.trigRates,line:{shape:'hvh'},
			name: "Triggers in "+data.integrationTime+ ' s',
			type: 'Scatter+Lines'	}];
		var plotTitle='QL LCs ('+ timeRangeString+')';

		var xAxisConfig={title: xlabel,
			mirror: 'ticks',
			showline:true,
		};
		var yAxisConfig={title: ylabel,
			mirror: 'ticks',
			showline:true,
		};
		var yAxisConfigRCR={title: 'RCR',
			mirror: 'ticks',
			showline:true,
		};
		if(logy){ 
			yAxisConfig['type']='log'; 
			yAxisConfigRCR['type']='log';
		}

		var lcLayout = { 
			showlegend: true, 	
			//	legend: { 	x: 0, y: 1.0 }, 
			title:'Background monitor light curves',
			xaxis: xAxisConfig,
			yaxis: yAxisConfig};
		var trigLayout = {
			showlegend: true, 	
			xaxis: xAxisConfig,
			yaxis: yAxisConfig
		};
		var rcrLayout = {
			showlegend: true, 	
			xaxis: xAxisConfig,
			yaxis: yAxisConfigRCR
		};

		Plotly.newPlot('lightcurves', lcTraces, lcLayout, config=StixCommon.plotlyConfigAllowSharing);
		Plotly.newPlot('triggers', trigTrace, trigLayout, config=StixCommon.plotlyConfigAllowSharing);

		//Plotly.newPlot('lightcurves', allTraces, layout, config=StixCommon.plotlyConfigAllowSharing);

		window.currentXaxisType=xaxisType;
		window.currentLogy=logy;
	}

	$('#previous').click(function(e) {
		e.preventDefault();
		requestBackgroundPackets(window.startUnix-window.timeSpanSeconds, window.timeSpanSeconds);
	});
	$('#next').click(function(e) {
		e.preventDefault();
		requestBackgroundPackets(window.startUnix+window.timeSpanSeconds, window.timeSpanSeconds);
	});

	$('#x-utc').click(function(e) {
		e.preventDefault();
		plotBackground(window.lightcurveData,0,false);
	});
	$('#x-t0').click(function(e) {
		e.preventDefault();
		plotBackground(window.lightcurveData,1,false);
	});
	$('#x-scet').click(function(e) {
		e.preventDefault();
		plotBackground(window.lightcurveData,2, false);
	});
	$('#set-logy').click(function(e) {
		e.preventDefault();
		plotBackground(window.lightcurveData,window.currentXaxisType, !window.currentLogy);
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

			requestBackgroundPackets(start,span);

		}


	});


	$( ".last-data" ).click(function( event ) {
		event.preventDefault();
		var spanHours=$(this).val();
		loadLastLigthCurves(spanHours*3600);

	});

	function loadLastLigthCurves(spanSeconds)
	{
		var url='/request/last-packet/timestamp/54118';
		$.getJSON(url, function(data) {
			var lastTime=data['unix_time'];
			if(lastTime>0)
			{
				requestBackgroundPackets(lastTime-spanSeconds,spanSeconds);
			}
			else
			{
				$('#status').html('No data in the requested time window');
			}
		});

	}



	function requestBackgroundPacketsOfRun(run)
	{
		$('#status').html('Requesting background data of run'+run);
		$.ajax({
			url: '/request/ql/bkg/run/'+run,
			dataType:"json",
			success: function (data) {
				if(data['status']!='OK')
				{
					$('#status').html(data['status']);
				}
				if(data['data'].length>0)
				{
					window.lightcurveData=getBackgroundData(data,0,0);
					plotBackground(window.lightcurveData, 0,false);
					var shareURL='/plot/background?run='+run;
					$('#share').attr('href',shareURL);

				}
				else
				{
					$('#status').html('No background data found for run: '+run);
				}

			}

		});
	}



	function requestBackgroundPackets(start, span)
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

		if(start>0&span>0)
		{
			window.startUnix=start;
			window.timeSpanSeconds=span;
		}

		$.ajax({
			url: '/request/ql/bkg/tw',
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
					window.lightcurveData=getBackgroundData(data,start,span);
					plotBackground(window.lightcurveData, 0,false);
					var shareURL='/plot/background?start='+start+'&span='+span;
					$('#share').attr('href',shareURL);

				}
				else
				{
					$('#status').html('No background data in the time window: '+StixDateTime.unixTime2ISOstring(start)+
						' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}


});






