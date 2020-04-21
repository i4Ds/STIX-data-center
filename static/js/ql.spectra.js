$(function() {

	var max_time_span=24*7*3600;
	$('#right-buttons').show();
	var Table=$('#packet-table').DataTable(
		{
			"bPaginate": false,
			"bFilter": false,
			"bInfo": false
		});
	if(window.fileID>=0)
	{
		loadQLSpectrumPacketsOfFile(window.fileID);
	}
	else if (window.packetID>=0)
	{
		loadSpectraOfPacket(window.packetID);
	}
	else if(window.startUnix >0 && window.timeSpanSeconds>0)
	{
		var msg='';
		loadQLSpectrumPacketsInTimewindow(window.startUnix, window.timeSpanSeconds,msg);
	}

	$('#previous').click(function(e) {
		e.preventDefault();
		loadQLSpectrumPacketsOfFile(window.fileID-1);
	});
	$('#next').click(function(e) {
		e.preventDefault();
		loadQLSpectrumPacketsOfFile(window.fileID+1);
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
			loadQLSpectrumPacketsInTimewindow(start,span);

		}
	});

	$( ".last-data" ).click(function( event ) {
		event.preventDefault();
		var spanHours=$(this).val();
		var url='/request/last-packet/timestamp/54120';
		$.getJSON(url, function(data) {
			var lastTime=data['unix_time'];
			if(lastTime>0)
			{
				loadQLSpectrumPacketsInTimewindow(lastTime-spanHours*3600,spanHours*3600, 'Request the data of the last '+spanHours+ ' hours.');
			}
			else{
				$('#status').html('No data in the requested time window');
			}
		});

	});

	$(document).on('click', '.plot-spectra', function(){ 
		var id=$(this).data('id');
		loadSpectraOfPacket(id);
		$('#plots').collapse('show');
	});

	function loadQLSpectrumPacketsInTimewindow(start, span, msg)
	{
		if(span>max_time_span)
		{
			span=max_time_span;
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
			url: '/request/ql/qlspec/tw',
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
					$('#status').html('Number of quicklook spectrum reports in the request time window :'+data['data'].length)
					showQLSpectrumPackets(data['data']);

				}
				else
				{
					$('#status').html('No quicklook spectrum report in the time window: '+StixDateTime.unixTime2ISOstring(start)+
						' to '+StixDateTime.unixTime2ISOstring(start+span));
				}

			}

		});
	}
	function loadQLSpectrumPacketsOfFile(fileID)
	{
		if(msg=='')
		{
			$('#status').html('Requesting data of file'+fileID);
		}
		else
		{
			$('#status').html(msg);
		}
		$.ajax({
			url: '/request/ql/qlspec/run/'+fileID,
			type:"GET",
			dataType:"json",
			success: function (data) {
				if(data['status']!='OK')
				{
					$('#status').html(data['status']);
				}
				if(data['data'].length>0)
				{
					$('#status').html('Number of quicklook spectrum reports in the request time window :'+data['data'].length)
					showQLSpectrumPackets(data['data']);
				}
				else
				{
					$('#status').html('No quicklook spectrum reports in the file: '+fileID);
				}

			}

		});
	}
	function showQLSpectrumPackets(data)
	{
		//console.log(data);
		$('#btn-spectrum').show();
		var table=$('#packet-table');
		var ydata=[];
		for(var i=0;i<data.length;i++)
		{
			var row=data[i];


				var numGroups=row['parameters'][14][1];
			var duration=0.1*(parseInt(row['parameters'][3][1])+1); 
			var tableRows=[ 
				row._id , 
				StixDateTime.unixTime2ISOstring(row['header']['unix_time']),  
				StixDateTime.SCET2ISOString(row['parameters'][1][1]), 
				duration,
				numGroups,
				'<a class="badge badge-success" href="/view/packet/id/'+row._id+'"><i class="fas fa-list"></i></a></td>',
				'<a class="plot-spectra badge badge-success"  data-id="'+row._id+'" href="#" ><i class="fas fa-chart-line"></i></a>'];
			ydata.push(tableRows);
		}
		Table.clear().rows.add(ydata).draw();
		$('#spectra-list').collapse('show');
	}

	function loadSpectraOfPacket(packetID)
	{
		$.ajax({
			url: '/request/packet/id/'+packetID,
			type:"GET",
			dataType:"json",
			success: function (data) {
				if(data.length>0)
				{

					var row=data[0];
					window.fileID=row['run_id'];
					var coarse=row['parameters'][1][1];
					var duration=0.1*(parseInt(row['parameters'][3][1])+1); 
					var startUTC=StixDateTime.SCET2ISOString(parseInt(coarse));
					$('#status').html('Showing packet #'+packetID+ ' , data acquisition started at '+startUTC+', duration '+duration+"s" );
					plotSpecificSpectra(row, startUTC, duration);
				}
				else
				{
					$('#status').html('Invalid packet id');
				}

			}

		});


	}
	function plotSpecificSpectra(data, startUTC, duration){
		var groupData=data['parameters'][14][3];
		var numSamples=groupData.length;
		var numGroups=data['parameters'][14][1];
		var spectra={};
		var binOrder=[];
		var xBinLowEdge=[];
		var triggers=[];
		var numSpectra=[];
		var detectorSpectra={};
		var i;
		var j;
		for(i=0;i<=32;i++)
		{
			detectorSpectra[i]=[];
			for(j=0;j<=32;j++)detectorSpectra[i][j]=0;
			binOrder[i]=i;
			xBinLowEdge[i]=i+0.;
			numSpectra[i]=0;
			triggers[i]=0;
		}

		for( i =0; i< numGroups;i++)
		{
			var detector=groupData[i*35][1]

			for(j=1;j<=32;j++){
				detectorSpectra[detector][j]+=groupData[i*35+j][2];
			}

			detectorSpectra[detector][32]== detectorSpectra[detector][31];
			//set the last two bins the same

			triggers[detector]+=groupData[i*35+33][2];
			numSpectra[detector]++;
		}
		numSpectra[32]=numSpectra[31];
		triggers[32]=triggers[31];

		var spectraTraces=[];
		var trigTrace=[];
		var integrationsTrace=[];
		var sumSpectrum=[];
		var countSum;

		for (i=0;i<32;i++)
		{
			countSum=0;
			for(j=0;j<32;j++){
				countSum+=detectorSpectra[j][i];
			}
			sumSpectrum.push(countSum);
		}
		sumSpectrum.push(countSum);
		//fix the plotly bug when using hvh

		//console.log(sumSpectrum);
		var sumSpectrumTrace=[{
			x: xBinLowEdge, 
			y:sumSpectrum,
			line:{shape:'hv'},
			name:  'Sum spec.',
			type: 'Scatter+Lines'
		}];

		for (i=0;i<32;i++)
		{
			var name="Detector "+binOrder[i];
			spectraTraces.push({
				x: xBinLowEdge,
				y: detectorSpectra[i],
				line:{shape:'hv'},
				name:  name,
				type: 'Scatter+Lines'
			});
		}
		trigTrace=[{x: xBinLowEdge,
			y: triggers,
			line:{shape:'hv'},
			name: "Total number of triggers",
			type: 'Scatter+Lines'	
		}];
	  var numSpectrumTrace=[
			{x: xBinLowEdge,
				y: numSpectra,
				line:{shape:'hv'},
			name: "Number of spectra",
			type: 'Scatter+Lines' 
			}

		];

		//var plotTitle='Detector specific spectra('+ startUTC+'+ '+numGroups+'*'+duration+ ')';

		var Ebins=[0, 4,5,6,7,8,9,10,11,12,13,14,15,16,18,20,22,25,28,32,36,40,45,50,56,63,70,76,84,100,120,150,'Emax'];
		var energyChannels=[];
		var k=0;
		for(k=0;k<=32;k++)energyChannels.push(k);
		//also 0-32
		
		var xAxisConfig={title: 'Energy (keV)',
			mirror: 'ticks',
			showline:true,
			range:[0,32],
			tickvals:energyChannels,
			ticktext:Ebins,
		};
		var yAxisConfig={title: "Counts ",
			mirror: 'ticks',
			showline:true,
		};


			var xAxisConfigTrig={title: 'Detector ',
			mirror: 'ticks',
			range:[0,32],
			showline:true,
		};
		var yAxisConfigInt={title: 'Wait time(s)',
			mirror: 'ticks',
			range:[0,32],
			showline:true,
		};
		var yAxisConfigNumSpectra={title: 'Number of spectra',
			mirror: 'ticks',
			range:[0,32],
			showline:true,
		};



		var sumSpectrumLayout = { 
			showlegend: true, 	
			xaxis: xAxisConfig,
			yaxis: yAxisConfig,
			title: '32 detector sum spectrum (sum of '+numGroups+' spectra, each duration '+duration+' s)'
		};


		var spectraLayout = { 
			showlegend: true, 	
			xaxis: xAxisConfig,
			yaxis: yAxisConfig,
			title: 'Detector individual spectra'
		};

		var trigLayout = {
			showlegend: true, 	
			xaxis: xAxisConfigTrig,
			yaxis: yAxisConfig,
			title: 'Accumulated counts'
		};
		var numSpectrumLayout = {
			showlegend: true, 	
			xaxis: xAxisConfigTrig,
			yaxis: yAxisConfigNumSpectra,
			title: 'Number of energy spectra in the packet'
		};






	/*	var integrationLayout = {
			showlegend: true, 	
			xaxis: xAxisConfigTrig,
			yaxis: yAxisConfigInt
		};
		*/

		Plotly.newPlot('spec-sum', sumSpectrumTrace, sumSpectrumLayout, config=StixCommon.plotlyConfigCloud);
		Plotly.newPlot('spectra', spectraTraces, spectraLayout, config=StixCommon.plotlyConfigCloud);
		Plotly.newPlot('spec-num', numSpectrumTrace, numSpectrumLayout, config=StixCommon.plotlyConfigCloud);
		Plotly.newPlot('triggers', trigTrace, trigLayout, config=StixCommon.plotlyConfigCloud);

	}



});






