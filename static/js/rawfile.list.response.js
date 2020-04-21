$(document).ready(function() {
	var table=$('#raw-table').DataTable({autoWidth:true, paging:false, bFilter: false});
	$('input[name="dates"]').daterangepicker();

	startId=0;
	maxId=-1;

	function formatTime(t)
	{
		t=Math.abs(t);
		var hours=Math.floor(t/3600.);
		var minutes=Math.floor((t-hours*3600)/60);
		return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
	}

	function getGapInfo(lastEnd, start, lastFileID)
	{
		var unixTime2019=1546300800;
		var unixTime2035=2051222400;
		if(start<unixTime2019|| lastEnd<unixTime2019) return "N/A";
		if(start>unixTime2035|| lastEnd>unixTime2035) return "N/A";
		var gapSeconds=start-lastEnd;
		var gapTimeString=formatTime(gapSeconds);
		var absGapSeconds=Math.abs(gapSeconds);
		
		var hours=Math.floor(absGapSeconds/3600.);
		var minutes=Math.floor((absGapSeconds-hours*3600)/60);
		var tooltipInfo='';
		if(gapSeconds<0){
			tooltipInfo='Overlap with file #'+lastFileID+': '+hours+' hrs '+minutes+' minutes';
		}
		else if(gapSeconds==0)
		{
			tooltipInfo='No overlap or gap';
		}
		else{
			tooltipInfo='Gap between this file and  file #'+lastFileID+': '+hours+' hrs '+minutes+' minutes';
		}

		var sign='';
		if(gapSeconds<0){
			sign='-';
		}
	
		return '<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+tooltipInfo+'" >'+sign+gapTimeString+'</span>';
	}

	function addRowsToProcessingRunsTable(data)
	{
		table.clear().draw();
		var dataSets=[];

		if(data.length>0)
		{
			if (data[0]._id > data[data.length-1]._id)
			{
				data.reverse();
			}
		}




		var lastFileEndTime=0;
		var lastFileID=-1;


		if(data.length>0){
			startId=data[0]._id;

			if(startId>data[data.length-1]._id)
			{
				startId=data[data.length-1]._id;
			}
		}

		for(var i=0;i<data.length;i++)
		{
			var row=data[i];
			var span=Math.floor(row.data_stop_unix_time-row.data_start_unix_time);
			var formattedDuration = formatTime(span);

			var gapInfo=getGapInfo(lastFileEndTime, row.data_start_unix_time, lastFileID);
			lastFileEndTime=row.data_stop_unix_time;
			lastFileID=row._id;

			var start=Math.floor(row.data_start_unix_time);
			var style='';
			if(!row.status)
			{
				style='badge badge-warning';
			}

			var fitsURL='<a href="/data/'+row.filename.split(".").slice(0, -1).join(".")+'"><i class="fas fa-download"  /></i></a>';
			if(row._id>=73){
				var startUTC=StixDateTime.unixTime2ISOstring(start);
				var folder=startUTC.slice(0,4)+'/'+parseInt(startUTC.slice(5,7)).toString().padStart(2,'0')+'/'+parseInt(startUTC.slice(8,10))+'/';
				fitsURL='<a href="/data/'+folder+'"><i class="fas fa-download"  /></i></a>';

			}

			var packetViewerURL='<span class="d-inline-block align-middle" data-toggle="tooltip" title="Browse packets of '+ row.filename+
				'"> <a class=" badge badge-success  '+style+'" href="/view/packet/file/'+row._id+'"><i class="fas fa-columns"></i></a></span> ';

			var housekeepingURL='<span class="d-inline-block align-middle" data-toggle="tooltip" title="Plot housekeeping parameters of '+ row.filename+ '">'
				+' <a class="badge badge-success  '+style+'" href="/plot/housekeeping/file/'+row._id+'"><i class="fas fa-chart-line"></i></a></span>';
			var	qlLCURL='<span class="d-inline-block align-middle" data-toggle="tooltip" title="Plot QL light curves of '+ row.filename+ '">'+
				'<a class="badge badge-success '+style+'" href="/plot/lightcurves?run='+row._id+'"><i class="fas fa-chart-line"></i></a></span>';
			var	qlBkgURL='<span class="d-inline-block align-middle" data-toggle="tooltip" title="Plot QL background light curves of '+ row.filename+ '">'+
				'<a class="badge badge-success  '+style+'" href="/plot/background?run='+row._id+'"><i class="fas fa-chart-line"></i></a></span>';
			var	qlSpecURL='<span class="d-inline-block align-middle" data-toggle="tooltip" title="Plot QL spectra of '+ row.filename+ '">'+
				'<a class="badge badge-success  '+style+'" href="/plot/qlspectra/file/'+row._id+'"><i class="fas fa-chart-line"></i></a></span>';
			//var comment='<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+row.comment+'" style="max-width:400px;"> '+ row.comment+'</span>';

			var calURL='';

			if (row.num_calibration>0)
			{
				calURL='<a class="badge badge-success" href="/plot/calibration/file/'+row._id+'">'+row.num_calibration+'</a>';
			}
			//	var bsdURL='<a class="badge badge-success" href="/plot/bsd/file/'+row._id+'">'+row._id+'</a>';

			var filesize=(row['summary']['total_length']/1024.).toFixed(1);
			dataSets.push([
				row._id,
				'<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+
				row.filename+'" style="max-width:400px;"> '+ row.filename
				+'</span> <div class="float-right"><a  href="/download/rawfile/'+row._id+'"><i class="fas fa-download"></i></a></div> ',
				StixDateTime.unixTime2ISOstring(row.run_start_unix_time),
				StixDateTime.unixTime2ISOstring(row.data_start_unix_time),
				formattedDuration,
				packetViewerURL,
				housekeepingURL,
				qlLCURL,
				qlBkgURL,
				qlSpecURL,
				calURL,
				//bsdURL,
				fitsURL,
				gapInfo
			]);

		}
		if(dataSets.length>0){
			table.rows.add(dataSets);
			table.columns.adjust().draw();
		}
	}
	$('input[name="dates"]').on('apply.daterangepicker', function(ev, picker) {
		var startUTC=picker.startDate.format('YYYY-MM-DDT00:00:00Z');
		var stopUTC=picker.endDate.format('YYYY-MM-DDT00:00:00Z');
		$.ajax({
			type: "POST",
			url:"/request/file/info/tw",
			data:{
				start: startUTC,
				end: stopUTC,
			},
			dataType:'json',
			success: function(data){
				addRowsToProcessingRunsTable(data);
				$('#table-caption').html("Showing raw data files from "+startUTC + " to " +stopUTC);
			}
		});
	});

	$.ajax({
		url:"/request/file/info/-1/20", //last 20 entries
		dataType:'json',
		success: function(data){
			addRowsToProcessingRunsTable(data);
			$('#table-caption').html("Showing latest raw data files");
		}
	});



	$("#btn-search-files").on('click',function(e){
		e.preventDefault();
		var filename= $("#input-filename").val();
		$.ajax({
			type: "POST",
			url:"/request/file/info/filename",
			data:{
				filename: filename,
			},
			dataType:'json',
			success: function(data){
				addRowsToProcessingRunsTable(data);
				$('#table-caption').html("Showing raw data files matching pattern "+filename);
			}
		});
	});


	$("#previous").on('click',function(e){
		var newStart=startId-20;
		if(newStart<=0)newStart=0;
		var end=newStart+20;
		//startId=newStart;

		$.ajax({
			url:"/request/file/info/"+newStart+"/20",
			dataType:'json',
			success: function(data){
				$('#table-caption').html("Requesting raw data files from "+newStart+" to "+end);
				addRowsToProcessingRunsTable(data);
				$('#table-caption').html("Showing raw data files from "+newStart+" to "+end);
			}
		});
	});

	$("#next").on('click',function(e){
		var newStart=startId+20;
		if(newStart>maxId)newStart=startId;
		var end=newStart+20;
		if(end>maxId)end=maxId;
		$.ajax({
			url:"/request/file/info/"+newStart+"/20",
			dataType:'json',
			success: function(data){
				$('#table-caption').html("Requesting raw data files from "+newStart+" to "+end);
				addRowsToProcessingRunsTable(data);
				$('#table-caption').html("Showing raw data files from "+newStart+" to "+end);
			}
		});
	});

	$.ajax({
			type: "GET",
			url:"/request/file/maxid",
			dataType:'json',
			success: function(data){
				maxId=data[0];
			}
		});







});
