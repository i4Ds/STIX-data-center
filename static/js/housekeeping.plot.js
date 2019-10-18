/*!
 * stix.housekeeping.plot.0.1
 * Author: Hualin Xiao 
 */
var analyzer=new StixPacketAnalyzer();




function plotAllParameters(data, msgContainer)
{
	var paramNames=Object.keys(data);
	var timeObj=StixDateTime.formatUnixTimeAxis(data['unix_time']);
	var timestamp=timeObj.unixTime;
	var T0_UTC=timeObj.T0_UTC;
	var T0=timeObj.T0;
	var utcs=timeObj.utc;
	var startUTC=utcs[0];
	var endUTC=utcs[utcs.length-1];

	var ydata ;
	var trace, traces;
	var layout;
	for (var i=0;i<paramNames.length;i++)
	{
		var pName=paramNames[i];
		if ($('#'+pName).length>0)
		{
			//div exists
			ydata=data[pName];
			var plotTitle=StixIDB.getParameterDescription(pName)+' - '+ pName;
			var textCalibration=StixIDB.getTextCalibration(pName);


			var ylabel='Value';
			var xlabel='Time [s] (T0: ' +T0_UTC+')';

			var timeSeries=data[pName];
			trace = {
				x: timestamp,
				y: timeSeries,
				text: utcs,
				line:{shape:'hvh'},
				type: 'Scatter+Lines'

			};

			var calibrationYValue=Object.keys(textCalibration);
			var calibrationYText=Object.values(textCalibration);
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

			if(calibrationYText.length>0)
			{
				yAxisConfig['tickmode']="array";
				yAxisConfig['tickvals']=calibrationYValue.map(Number);
				yAxisConfig['ticktext']=calibrationYText;
			}


			layout = {
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
				width: 600,
				height: 300,
				xaxis: xAxisConfig,
				yaxis: yAxisConfig

			};
			Plotly.newPlot(pName, [trace], layout, config=StixCommon.plotlyConfig);
		}
	}
	$(msgContainer).html('Showing data from '+startUTC+' to '+endUTC);

}


function analyzeHousekeeping(data)
{
	analyzer.reset();
	var stat=data['status'];
	var packets=data['packets'];
	if(stat!='OK' && stat!='TOO_MANY')
	{
		$('#status').html(stat);
	}
	else if(stat=='TOO_MANY')
	{
		$('#status').html('Too many packets. Only '+packets.length+ ' packets retrieved...');

	}
	else if (stat=='OK')
	{
		$('#status').html('Number of packets received:'+packets.length);
	}
	analyzer.mergePackets(packets,[54101,54102]);
	var results=analyzer.getAllParameters();
	$('#status').html('Preparing data...');
	plotAllParameters(results, '#status');
	
	//finished
	try{
		var unixTimeArray=results['unix_time'];
		var len=unixTimeArray.length;
		var start=unixTimeArray[0];
		var span=unixTimeArray[len-1]-start;
		if(window.startUnix<=0)
		{
			//current time not set
			window.startUnix=start;
		}

		//in case wrong timing
		if(span>3600*24)span=3600*24;
		if(span<=0)span=60;

		if(window.timeSpanSeconds<=0)
		{
			window.timeSpanSeconds=span;
		}


		var shareURL='/plot/housekeeping?start_unix='+start+'&span_sec='+span;
		$('#share').attr('href',shareURL);

	}catch(e)
	{
	}

}


