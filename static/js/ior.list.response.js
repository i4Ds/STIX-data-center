$(document).ready(function() {
	var table=$('#ior-table').DataTable({autoWidth:true, paging:false});
	$('input[name="dates"]').daterangepicker();

	function addRows(data)
	{
		table.clear().draw();
		var dataSets=[];
		for(var i=0;i<data.length;i++)
		{
			var row=data[i];
			if (row.startUnix===undefined || row.stopUnix=== undefined || row.genUnix===undefined)continue;
			var start=Math.floor(row.startUnix);
			var stop=Math.floor(row.stopUnix);
			var gen=Math.floor(row.genUnix);


			dataSets.push([
				row._id,
				'<span class="d-inline-block text-truncate" data-toggle="tooltip" title="'+row.filename+'" style="max-width:500px;"> '+ row.filename+'</span>',
				StixDateTime.unixTime2ISOstring(gen),
				StixDateTime.unixTime2ISOstring(start),
				StixDateTime.unixTime2ISOstring(stop),
				'<a class="badge badge-success " href="/view/ior/'+row._id+'"><i class="fas fa-columns"></i></a> ',
				'<a class="badge badge-success " href="/view/ior/overview/'+row._id+'"><i class="fas fa-list"></i></a> ',
				row.phase,
				row.description
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
		var timeType=$("input[name='time-type']:checked").val();
		$.ajax({
			type: "POST",
			url:"/request/ior/info/tw",
			data:{
				start: startUTC,
				end: stopUTC,
				timeType: timeType,
			},
			dataType:'json',
			success: function(data){
				addRows(data);
			}
		});
	});

	$.ajax({
			url:"/request/ior/info/last", //last 50 entries
			dataType:'json',
			success: function(data){
				addRows(data);
			}
		});
	




});
