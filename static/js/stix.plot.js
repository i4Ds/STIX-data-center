//Plotting library 
//hualin.xiao@fhnw.ch
//2019-10-09

function appendDiv(container, divID, left=true)
{

	var adiv='<div class="row"><div  class="col-md-6" id="'+canvas+'"></div></div>';
	$("#"+container).append(adiv);
}

var StixPlot={
	plotTimeSeriesInSubplots: function(data, pNames, groupTitle,  containerDiv, statusDiv)
	{
		var trace;
		var traces=[];
		var parameterNames;
		if(Array.isArray(pNames))
		{
			parameterNames=pNames;
		}
		else
		{
			parameterNames=[pNames];
		}

		var timeObj=StixDateTime.resetUnixTimestamp(data['time']);
		var timestamp=timeObj.time;
		var T0_UTC=timeObj.T0_UTC;
		var T0=timeObj.T0;
		$(statusDiv).html('Plotting group '+groupTitle);
		var name;
		var numPlots=0;
		for(var i=0;i<parameterNames.length;i++)
		{
			name=parameterNames[i];
			if(name=='time')continue;
			var title=StixIDB.getParameterDescription(name)+' - '+ name;

			var ylabel='Value';
			var xlabel='Time [s] (T0: ' +T0_UTC+')';

			var timeSeries=data[name];

			trace = {
				x: timestamp,
				y: timeSeries,
				xaxis: xlabel,
				yaxis: ylabel,
				type: 'scatter',
				mode: 'lines+marker',
				name: title
			};

			traces[numPlots]=trace;
			numPlots++;
		}
		var nrows=1;
		var ncols;
		if (numPlots<=3)
		{
			nrows=numPlots;
			ncols=1;
		}
		else{
			ncols=2;
			nrows=Math.ceil(numPlots/ncols);
		}

		var	layout = {
			title: groupTitle,
			autosize: false,
			width: 900,
			height: 500,
			sharey:false,
			grid:{rows: nrows, columns: ncols, pattern: 'independent'}, 
		};

		Plotly.newPlot(containerDiv, traces, layout);



	},
	plotTimeSeriesSinglePlot: function(data,  statusDiv)
	{
		var timeObj=StixDateTime.resetSCET(data['time']);
		var timestamp=timeObj.time;
		var T0_UTC=timeObj.T0_UTC;
		var T0=timeObj.T0;
		$(statusDiv).html('Plotting group '+groupTitle);
		var name;
		var numPlots=0;

		for(var i=0;i<parameterNames.length;i++)
		{
			name=parameterNames[i];
			if(name=='time')continue;
			var title=StixIDB.getParameterDescription(name)+' - '+ name;

			var ylabel='Value';
			var xlabel='Time [s] (T0: ' +T0_UTC+')';

			console.log("YLABEL:");
			console.log(xlabel);
			var timeSeries=data[name];

			trace = {
				x: timestamp,
				y: timeSeries,
				xaxis: xlabel,
				yaxis: ylabel,
				type: 'scatter',
				mode: 'lines+marker',
				name: title
			};
			var dataPlot=[trace];

			var	layout = {
				title: groupTitle,
				autosize: false,
				width: 900,
				height: 500,
			};
			var divName=groupTitle+'name';
			appendDiv(containerDiv, divName);

			Plotly.newPlot(divName, traces, layout);
		}

	},
	plot1DArray: function(ydata, title, xlabel, ylabel, div, width, height, x0=0, binw=1){

		var xdata=[];
		for(var i=0;i<ydata.length;i++)xdata[i]=x0+i*binw;

		var	trace = {
			x: xdata ,
			y: ydata,
			type: 'scatter',
			mode: 'lines+marker',
		};
		var dataPlot=[trace];
		var layout = {
			title: title,
			xaxis: {
				title:xlabel ,
			},
			yaxis: {
				title: ylabel,
			}
		};

		Plotly.newPlot(div, dataPlot, layout, StixCommon.plotlyConfigAllowSharing);
	}

};



