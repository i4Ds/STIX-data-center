window.occurrenceData=[];
var MAXLENGTH=10;
var numOccurrences=0;
var totalDuration=0;
function loadRequest(requestID)
{
	$('#msg').html('Requesting operation request #'+requestID+'...');
	$.ajax({
		url: '/request/ior/'+requestID,
		type:"GET",
		dataType:"json",
		success: function (data) {
			createOverview(data,'#occurrences');
		}

	});
}
if(window.fileID>=0)
{
	loadRequest(window.fileID);
}
else{
	$('#msg').html("No PDOR is loaded.");
}

function clearList(){
	var selector="#occurrences";
	$("#occurrences").html("");
	window.occurrenceData=[];
}
function getDuration(seqName){
	var duration=0;
	if (!seqName.includes('ZIX'))
	{

		$.ajax({
			url: '/request/ior/css/'+seqName,
			type:"GET",
			dataType:"json",
			async:false,
			success: function (css) {
				var row='';
				for(var j=0;j<css.length;j++){
					var commandData=css[j];
					var releaseTime=commandData[5];
					if(releaseTime)
					{
						duration+=releaseTime;
					}
				}

			}

		});
	}
	return duration;

}


function getParameterList(ID){
	//$('#parameters').treetable("unloadBranch",1);

	if( !Array.isArray(occurrenceData)||occurrenceData.length==0)
	{
		return "";
	}
	var data=occurrenceData[ID].parameters;
	var seqName=occurrenceData[ID].name;
	if(seqName=='AIXF414A'){
		var pName=StixIDB.getASWParameterName(data[0][1]);
		var value=data[2][1];
		return '<ul> <li> '+pName+' = '+value +'</li>  </ul>';
	}
	var paramDescription="<ul>";
	var length=data.length;
	if(data.length>MAXLENGTH)length=MAXLENGTH;
	var PIX00082='';
	var PIX00093='';
	for (var i = 0; i < length; i++) 
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
			physicalValue=' ('+StixDateTime.SCET2ISOString(parseInt(value))+')';
		}
		if(name=='PIX00016')
		{
			//get ASW parameter  name
			physicalValue=' ('+StixIDB.getASWParameterName(value)+')';
		}
		if(name=="PIX00083")
		{
			physicalValue=' ('+StixIDB.getSubSystemName(PIX00082, value)+')';
		}
		if(name=="PIX00082")PIX00082=value;

		if(name=='PIX00120' && (seqName=="AIXF062E"||seqName=="ZIX36605" )){
			if (PIX00093=='HV01-16Voltage' || PIX00093=='HV17-32Voltage')physicalValue= ' ('+Math.round(value/0.15)+' V)';

		}
		if(name=="PIX00052")physicalValue='('+(parseInt(value)+1)/0.78125 +' us)';
		//latency

		if(name=="PIX00093")PIX00093=value;
		paramDescription+='<li>'+paramDesc+ ' ('+ name+') = ' +value +  physicalValue+'</li>';
	}
	if(data.length>MAXLENGTH){
		paramDescription+='<li> '+(data.length-MAXLENGTH)+' parameters more... </li>';

	}
	paramDescription+='</ul>';
	return paramDescription;
}

function createOverview(docs)
{
	clearList();
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


	$('#file-info').html('<h4>'+report.filename+'</h4>');
	var listContent="<ul>";
	var lastExecutationTime=0;

	for( var i=0; i< occurrences.length;i++){
		var occurrence=occurrences[i];
		var descr=occurrence.desc;
		var description=descr[1]!=""?descr[1]:descr[0];
		var name=occurrence.name;
		var actionTime=occurrence.actionTime;
		var wait = 0;
		var timeString;
		wait+=lastExecutationTime;
		var regex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/g;
		var found = actionTime.match(regex);
		if(found){
			timeString=actionTime;
		}
		else if(actionTime.includes(':'))
		{
			lastExecutationTime=getDuration(name);

			var timeStr=actionTime.split(':');
			if(timeStr.length==3){
				wait+=parseInt(timeStr[0])*3600+ parseInt(timeStr[1])*60+parseInt(timeStr[2]);
			}

			//	var type=occurrence.type;
			//	var classType=(type=='command')?'TC':'';
			//	var date = new Date(0);
			//date.setSeconds(wait); // specify value for SECONDS here
			totalDuration+=wait;
			timeString='+' +wait+ ' s'; //date.toISOString().substr(11, 8);
		}

		var row;
		var paramDescription;
		if(name=='ZIX37019'||name=='AIXF415A'){
			paramDescription=getParameterList(i);
			row='Report ASW parameter '+paramDescription+'<br>';
		}
		else{
			row= '<h6><b>'+timeString+'</b> , execute <b>'+ name + " &ndash; "+description+'</b> </h6>';
			paramDescription=getParameterList(i);
			row+=paramDescription;
		}

		var paramDescription=getParameterList(i);
		row+=paramDescription;
		listContent+='<li>'+row+'</li>';
	}
	totalDuration+=lastExecutationTime;

	numOccurrences=occurrences.length;

	listContent+="</ul>";
	$('#occurrences').append(listContent);
	$('#summary').html("<h6 class='mt-2'><b>Number of sequences(or TCs): </b>"+numOccurrences+" <b>, Duration:</b> ~"+ totalDuration+'s </h6>');
	$('#msg').html('');
}







