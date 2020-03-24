//Plotting library 
//hualin.xiao@fhnw.ch
//2019-10-09

function appendDiv(container, divID, left=true)
{

	var adiv='<div class="row"><div  class="col-md-6" id="'+canvas+'"></div></div>';
	$("#"+container).append(adiv);
}

var StixPlot={

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
				mirror:'ticks',
				title:xlabel ,
				mirror:'allticks',
				zeroline:false,
				showline:true
			},
			yaxis: {
				title: ylabel,
				showline:true,
				mirror:'allticks',
				zeroline:false,
			}
		};

		Plotly.newPlot(div, dataPlot, layout, StixCommon.plotlyConfigAllowSharing);
	},




};
