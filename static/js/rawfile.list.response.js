$(document).ready(function() {
	var table=$('#raw-table').DataTable({autoWidth:true, paging:false});
	$('input[name="dates"]').daterangepicker();

	function addRowsToProcessingRunsTable(data)
	{
		table.clear().draw();
		var dataSets=[];
		for(var i=0;i<data.length;i++)
		{
			var row=data[i];
			var span=Math.floor(row.data_stop_unix_time-row.data_start_unix_time);
			var start=Math.floor(row.data_start_unix_time);
			var style='';
			if(!row.status)
			{
				style='badge badge-warning';
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
			var comment='<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+row.comment+'" style="max-width:400px;"> '+ row.comment+'</span>';
			var calURL='';

			if (row.num_calibration>0)
			{
				calURL='<a class="badge badge-success" href="/plot/calibration/file/'+row._id+'">'+row.num_calibration+'</a>';
			}

			dataSets.push([
				row._id,
				'<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+row.filename+'" style="max-width:400px;"> '+ row.filename+'</span> <div class="float-right"><a  href="/download/rawfile/'+row._id+'"><i class="fas fa-download"></i></a></div> ',
				StixDateTime.unixTime2ISOstring(row.run_start_unix_time),
				StixDateTime.unixTime2ISOstring(row.data_start_unix_time),
				Math.floor(span/60.),
				packetViewerURL,
				housekeepingURL,
				qlLCURL,
				qlBkgURL,
				qlSpecURL,
				calURL,
				comment
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
	




});
