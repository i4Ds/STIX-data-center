/*!
 * stix.housekeeping.plot.0.1
 * Author: Hualin Xiao 
 */
var analyzer=new StixPacketAnalyzer();




function plotAllParameters(data,analyzer,  msgContainer)
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
			var paramDescription=StixIDB.getParameterDescription(pName);
			var plotTitle=paramDescription+' - '+ pName;
			var textCalibration=StixIDB.getTextCalibration(pName);
			var paramType=analyzer.getParameterType(pName);
			var paramUnit='';
			var ylabel='Raw value';
			if (paramType==1){
				paramUnit=StixIDB.getParameterUnit(pName);
				ylabel='Eng. value';
				if(paramUnit!=undefined){
					if(paramUnit.length>0)
					{
						ylabel+='('+paramUnit+')';
					}
				}
			}


			var xlabel='UTC';

			var timeSeries=data[pName];
			trace = {
				x: utcs,
				y: timeSeries,
				line:{shape:'hvh'},
				type: 'Scatter+Lines'

			};

			var calibratedYValue=Object.keys(textCalibration);
			var calibratedYText=Object.values(textCalibration);
			var xAxisConfig={
				showline:true,
				mirror:'ticks',
				zeroline:false,
				titlefont: {
					family: 'Arial, monospace',
					size: 14,
					color: '#7f7f7f'
				}
			};
			var yAxisConfig={
				title: ylabel,
				showline:true,
				mirror:'ticks',
				zeroline:false,
				titlefont: {
					family: 'Arial, monospace',
					size: 14,
					color: '#7f7f7f'
				},
			};

			if(calibratedYText.length>0)
			{
				yAxisConfig['tickmode']="array";
				yAxisConfig['tickvals']=calibratedYValue.map(Number);
				yAxisConfig['ticktext']=calibratedYText;
				yAxisConfig['title']='';

			}


			layout = {
				 title: {
					text:plotTitle,
					font: {
						family: 'Courier New, monospace',
						size:16 
					},
					xref: 'paper',
					x: 0.2,
					y: 0.8,
					 xanchor:'left',
					 yanchor:'bottom',
				},
				autosize: false,
				width: 600,
				height: 350,
				xaxis: xAxisConfig,
				yaxis: yAxisConfig

			};
			var traces=[trace];
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
	plotAllParameters(results, analyzer,  '#status');
	
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


