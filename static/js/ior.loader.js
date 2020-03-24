window.occurrenceData=[];
var totalDuration=0;

function nodeExpand () {
	// alert("Expanded: " + this.id);
	//	getNodeViaAjax(this.id);  
}


function nodeCollapse () {
	// alert("Collapsed: " + this.id);
}
function clearParameters(){
	var selector="#parameters";
	var node= $(selector).treetable("node",1);
	if(node)$(selector).treetable("unloadBranch",node);
	node= $(selector).treetable("node",2);
	if(node)$(selector).treetable("unloadBranch",node);
	$('#command-number').html('[0]');
	$('#param-number').html('[0]');



}
function clearList(){
	var selector="#occurrences";
	$("#occurrences > tbody").html("");
	window.occurrenceData=[];
}
function getDuration(seqName){
	if (!seqName.includes('ZIX'))
	{

		$.ajax({
			url: '/request/ior/css/'+seqName,
			type:"GET",
			dataType:"json",
			success: function (css) {
				var duration=0;
				for(var j=0;j<css.length;j++){
					var commandData=css[j];
					var releaseTime=commandData[5];
					if(releaseTime)
					{
						duration+=releaseTime;
					}
				}
				totalDuration+=duration;
				$('#'+seqName+'-duration').html(duration);
				$('#duration-info').html('<span class="ml-2"> Total duration: <b>'+totalDuration+'s</b> </span>');
			}

		});
	}

}



function loadOccurrence(ID){
	//$('#parameters').treetable("unloadBranch",1);

	clearParameters();
	if( !Array.isArray(occurrenceData)||occurrenceData.length==0)
	{
		return;
	}
	$('#command-sequences').html('');

	var data=occurrenceData[ID].parameters;
	var seqName=occurrenceData[ID].name;

	if(seqName != undefined){
		if (!seqName.includes('ZIX'))
		{

			$.ajax({
				url: '/request/ior/css/'+seqName,
				type:"GET",
				dataType:"json",
				success: function (css) {
					var row='';
					var commandDescription='';

					var parentNode=$('#parameters').treetable("node",2);
					$('#command-number').html('['+css.length+']');
					for(var j=0;j<css.length;j++){
						var commandData=css[j];
						var timePrefix= (commandData[3]=='R')? '+': 'At ';
						var releaseTime=commandData[5];
						var timeString;
						if(releaseTime===undefined){
							timeString=commandData[4];
						}
						else{
							timeString=commandData[5]+'s';
						}
						var formattedTime='<b>'+timePrefix + timeString+'</b>';
						commandDescription=formattedTime+' release <b>'+ commandData[0] + '</b> '+commandData[1];
						var rowContent ='<tr data-tt-id="2.' + j+ '" data-tt-parent-id="2" ><td colspan="4">'+commandDescription+'</td></tr>';
						$('#parameters').treetable("loadBranch", parentNode, rowContent);
					}
					//$('#command-sequences').html(commandDescription);

				}

			});
		}
	}


	var parentNode=$('#parameters').treetable("node",1);
	$('#param-number').html('['+data.length+']');
	var PIX00082='';

	for (var i = 0; i < data.length; i++) 
	{
		var param=data[i];
		var name=param[4];
		if(name==""){
			name=param[0];
		}
		var value=param[1];
		var physicalValue='';
		var paramDesc=StixIDB.getParameterDescription(name);
		if(paramDesc==""){
			paramDesc=param[2];
		}
		if (StixIDB.SCET_TIMESTAMPS.includes(name))
		{
			physicalValue=StixDateTime.SCET2ISOString(parseInt(value));
		}
		if(name=='PIX00016')
		{
			//get ASW parameter  name
			physicalValue=StixIDB.getASWParameterName(value);
		}
		if(name=="PIX00083")
		{
			physicalValue=StixIDB.getSubSystemName(PIX00082, value);
		}

		if(name=='PIX00120' && (seqName=="AIXF062E"||seqName=="ZIX36605" )){
			if (PIX00093=='HV01-16Voltage' || PIX00093=='HV17-32Voltage')physicalValue= Math.round(value/0.15)+' V';

		}


		if(name=="PIX00093")PIX00093=value;

		if(name=="PIX00052")physicalValue=(parseInt(value)+1)/0.78125 +' us';
		//latency to us

		if(name=="PIX00082")
		{
			PIX00082=value;
		}

		var hex='';
		if(!isNaN(value)){
			hex='0x'+parseInt(value).toString(16).toUpperCase();
		}

		var row ='<tr data-tt-id="1.' + 
			i+ '" data-tt-parent-id="1" >'+
			'<td>'+name+'</td>'+
			'<td >'+paramDesc+'</td>'+
			'<td ><a href="#" data-toogle="tooltip" title="'+hex+'" >'+value+'</a></td>'+
			'<td>'+physicalValue+'</td></tr>';
		$('#parameters').treetable("loadBranch", parentNode, row);

	}
}

function displayOverview(docs)
{
	clearList();
	var tableRows='';
	if(docs.length==0)
	{
		$('#msg').html("Invalid operation request");
		return;
	}
	var report=docs[0];
	var occurrences=report.occurrences;
	if(occurrences==undefined){
		$('#msg').html("No occurrence is found  in this operation request");
		return;
	}

	var info='<span  class="top-info" >'+report.filename+'</span> created at <span class="top-info" >'+StixDateTime.unixTime2ISOstring(report.genUnix)+
		'</span>, valid from <span class="top-info" >'+ StixDateTime.unixTime2ISOstring(report.startUnix)+
		'</span> to <span class="top-info" >'+StixDateTime.unixTime2ISOstring(report.stopUnix)+'</span>';
	$('#top-info').html(info);

	occurrenceData=occurrences;

	for( var i=0; i< occurrences.length;i++){
		var occurrence=occurrences[i];
		var descr=occurrence.desc;
		var description=descr[1]!=""?descr[1]:descr[0];

		var name=occurrence.name;
		var actionTime=occurrence.actionTime;

		var wait = 0;
		var duration=0;
		if(actionTime.includes(':'))
		{
			getDuration(name);

			var timeStr=actionTime.split(':');
			if(timeStr.length==3){
				wait+=parseInt(timeStr[0])*3600+ parseInt(timeStr[1])*60+parseInt(timeStr[2]);
			}
		}
		totalDuration+=wait;


		var type=occurrence.type;
		var classType=(type=='command')?'TC':'';

		tableRows+='<tr id="' +i+'" class="'+classType+'">'+
			'<td width="10%">'+i+'</td>'+
			'<td width="15%" >'+actionTime+ '</td>'+
			'<td width="15%" id="'+name+'-duration" >'+duration+ '</td>'+
			'<td width="10%" >'+name+ '</td>'+
			'<td width="50%" >'+description+ '</td>';
	}
	$('#occurrences  tbody').append(tableRows);

}







