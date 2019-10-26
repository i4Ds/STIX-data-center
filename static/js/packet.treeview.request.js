$(function() {

	if(packetId>=0)
	{

		loadStixPacket(packetId,true);
	}
	else if(calibrationId>=0)
	{

		$('#msg').html('Loading packets of file #'+calibrationId+'...');
		$('#leftloader').show();
		$.ajax({
			url: '/request/headers/calibration/'+calibrationId,
			type:"GET",
			dataType:"json",
			success: function (data) {
				$('#leftloader').hide();
				displayStixHeaders(data,'#headerTreeView');
				console.log(data);
				$('#msg').html('Showing packet(s) of calibration run #'+calibrationId)
			}

		});
	}
	else if(fileId>=0)
	{

		$('#msg').html('Loading packets of file #'+fileId+'...');
		$('#leftloader').show();
		$.ajax({
			url: '/request/headers/file/'+fileId,
			type:"GET",
			dataType:"json",
			success: function (data) {
				$('#leftloader').hide();
				displayStixHeaders(data,'#headerTreeView');
				$('#msg').html('Showing packets of file #'+fileId)
			}

		});
	}
	else
	{
		loadStixLatestPacketHeaders(5,200);

	}


});
