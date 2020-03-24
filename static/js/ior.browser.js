$(function() {

	$("#search").on("keyup", function() {
		var value = $(this).val().toLowerCase();
		$("#occurrences tr").filter(function() {
			$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
		});
	});
	$('#next').on('click',function(e){
		loadOperationRequest(window.fileID+1);
	});
	$('#previous').on('click',function(e){
		var requestID=window.fileID-1;
		if (requestID>=0){
			loadOperationRequest(requestID);
		}
	});

	$("#occurrences").on('click','tr',function(e){
		var occurrenceId=this.id;
		$(this).addClass("selected").siblings().removeClass("selected"); 
		loadOccurrence(occurrenceId);
		$('#msg').html("Ocurrence #"+($(this).index()+1));
	});
	$("#parameters").treetable({
		expandable:     true,
		onNodeExpand:   nodeExpand,
		onNodeCollapse: nodeCollapse
	});

	// expand node with ID "1" by default
	$("#parameters").treetable("reveal", '1');
	// Highlight a row when selected
	$("#parameters tbody").on("mousedown", "tr", function() {
		$(".selected").not(this).removeClass("selected");
		$(this).toggleClass("selected");
	});

	if(window.fileID>=0){
		loadOperationRequest(window.fileID);
	}
	function loadOperationRequest(requestID){
		$('#msg').html('Requesting operation request #'+requestID+'...');
		$('#leftloader').show();
		$.ajax({
			url: '/request/ior/'+requestID,
			type:"GET",
			dataType:"json",
			success: function (data) {
				$('#leftloader').hide();
				displayOverview(data,'#occurrences');
				$('#msg').html('Showing occurrences(s) of operation request #'+requestID)
				window.fileID=requestID;
			}

		});
	}



});




