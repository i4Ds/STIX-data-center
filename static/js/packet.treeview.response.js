
$(function() {

		$('#headerTreeView').treetable();
		$("#headerTreeView").on('click','tr',function(e){
			var headerId=this.id;
			loadStixPacket(headerId);
			$('#msg').html("Current packet: "+($(this).index()+1));
		});




});
