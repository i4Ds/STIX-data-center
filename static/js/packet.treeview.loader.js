
var DEFAULT_MAX_DEPTH=40;
//var currentHeaderID=-1;
var lastPacketData={};
var lastDepth={};

var lastPacketID=0;


function nodeExpand () {
	// alert("Expanded: " + this.id);
	//	getNodeViaAjax(this.id);  
}


function nodeCollapse () {
	// alert("Collapsed: " + this.id);
}

function displayHeaderInPacketView(selector, parentId, parentNode, header)
{

	var i=0;
	var nodeToAdd, row,newId;
	for (var key in header )
	{
		if (key=='_id')continue;
		newId=parentId+'.'+i;
		i++;
		nodeToAdd = $(selector).treetable("node",newId);

		// check if node already exists. If not add row to parent node
		if(!nodeToAdd)
		{

			row ='<tr data-tt-id="' + 
				newId + 
				'" data-tt-parent-id="' +
				parentId + '" ';
			headerValue=header[key];
			if (key=="UTC"&&( typeof headerValue === 'object'))
			{
				var utc=new Date(headerValue["$date"]);
				headerValue=utc.toISOString();
			}

			row += ' >';
			row += "<td>" + key + "</td>";
			row += "<td>"+headerValue+"</td>";
			row += "<td></td>";
			row += "<td></td>";
			row +="</tr>";
			$(selector).treetable("loadBranch", parentNode, row);
		}

	}
}




function displayParametersInPacketView(selector, parentId,  childArray, packetId, level, maxDepth,iStart)
{

	var i=0;
	var nodeToAdd, row,newId;
	var length=0;
	if( !Array.isArray(childArray)||childArray.length==0)
	{
		return;
	}
	var parentNode=$(selector).treetable("node",parentId);
	length=childArray.length;
	childlength=length;
	if(level>0 &&length>maxDepth)
	{
		length=maxDepth;
	}
	for (var i = iStart; i < length; i++) 
	{
		var node = childArray[i];
		newId=parentId+'.'+i;
		nodeToAdd = $(selector).treetable("node",newId);
		if(!nodeToAdd) {
			var raw="";
			var paramName='';
			var paramDescr='';
			var paramChildren=[];
			var paramRaw='';
			var paramEng='';
			if (Array.isArray(node))
			{
				paramName=node[0];
				paramRaw=node[1];
				paramEng=node[2];
				paramChildren=node[3];
			}

			paramDescr=StixIDB.getParameterDescription(paramName); 
			if(paramName.includes('NIXG'))continue;
			//id="'+packetId+"-"+parentId+"-"+i+'" 
			//

			row ='<tr  data-name="'+paramName+'"  data-tt-id="' + 
				newId + 
				'" data-tt-parent-id="' +
				parentId + '" ';
			if (Array.isArray(paramChildren) && paramChildren.length>0)
			{
				row += ' data-tt-branch="true" ';
			}
			row += ' >';

			var engValue="";
			var paramUnit="";
			if(paramEng)
			{
				paramUnit=StixIDB.getParameterUnit(paramName);
			}
			if(paramName=='PIX00016')
			{
				paramEng=StixIDB.getASWParameterName(paramRaw);
				//get ASW parameter  name
			}

			var hex='';
			if(!isNaN(paramRaw)){
				hex='0x'+parseInt(paramRaw).toString(16).toUpperCase();
			}
			row += "<td>" + paramName+ "</td>";
			row += "<td>" + paramDescr+ "</td>";
			row+ ='<td ><a href="#" data-toogle="tooltip" title="'+hex+'" >'+paramRaw+'</a></td>';
			row += "<td>" + paramEng+ "</td>";
			row += "<td>" + paramUnit+ "</td>";
			row +="</tr>";
			$(selector).treetable("loadBranch", parentNode, row);

			if(level>0 &&childlength>maxDepth&& i==(maxDepth-1))
			{
				
			row ='<tr  data-name="more.'+paramName+'"  data-tt-id="more-' + 
				newId + '" data-tt-parent-id="' +parentId + '"> ';
			
				var moreLink='<a class="load-more" href="#" data-istart="'+iStart+'" data-pid="'+parentId+'" data-pktid="'+packetId+'" data-level="'+level+'">More ('+maxDepth+'/'+childlength+')...</a>'; 
				lastPacketData[parentId]=childArray;
				lastDepth['p'+packetId+'.'+parentId]=maxDepth;
				row += "<td>"+moreLink+"</td><td></td><td></td><td></td><td></td></tr>";
				$(selector).treetable("loadBranch", parentNode, row);
			}

			if (Array.isArray(paramChildren) && paramChildren.length>0)
			{
				displayParametersInPacketView(selector, newId,  paramChildren, packetId , level+1, maxDepth,0);

			} 
		}
	}
}
	$(document).on('click', '.load-more', function(e){ 
		e.preventDefault();
		var id=$(this).data('pktid');
		var level=$(this).data('level');
		var parentId=$(this).data('pid');
		var iStart=$(this).data('istart');
		var selector="#packetTreeView";
		var paramRootId=2;
		var depth=	lastDepth['p'+packetId+'.'+parentId]+DEFAULT_MAX_DEPTH;
		displayParametersInPacketView(selector, parentId,  lastPacketData[parentId],id, level,depth,iStart);
		lastPacketID=id;
		$(this).closest('tr').hide();
	});


function displayPacket(data, depth) 
{
	packet=data[0];
	var selector="#packetTreeView";
	var headerRootId=1;
	var paramRootId=2;

	var header=packet.header;
	var parameters=packet.parameters;

	var headerNode= $(selector).treetable("node",headerRootId);
	var paramNode= $(selector).treetable("node",paramRootId);

	if(headerNode){
		$(selector).treetable("unloadBranch",headerNode);
	}
	if(paramNode)
	{
		$(selector).treetable("unloadBranch",paramNode);
	}
	displayHeaderInPacketView(selector, headerRootId, headerNode, header) ;
	packetId=packet._id;
	displayParametersInPacketView(selector, paramRootId,  parameters, packetId,0,depth,0);
}

function displayStixHeaders(data)
{
	//console.log(data);
	var packets=data["data"];
	var status=data['status'];
	if(	status!="OK" && status!="TOO_MANY")
	{
		$('#msg').html(data['status']);
	}
	else
	{
		$('#msg').html('Total number of packets: '+packets.length);
	}

	window.packetIDList.length=0;
	//clear the array

	var tableRows='';
	for( var i=0; i< packets.length;i++){
		var packet=packets[i];
		window.packetIDList.push(packet[0]);

		var timestamp=StixDateTime.unixTime2ISOstring(packet[4]);
		var descr;
		if (packet[1]=='TM')
		{
			descr=StixIDB.getTMDescription(packet[5]);
		}
		else
		{
			descr=StixIDB.getTCDescription(packet[5]);
		}
		tableRows+='<tr id="' +packet[0]+'" class="'+packet[1]+' stype-'+packet[2]+" service-"+packet[2]+"-"+
			packet[3]+'">'+'<td width="10%">'+i+'</td><td width="20%" >'+ timestamp+ '</td><td width="10%" >'+packet[1]+'('+packet[2]+','+
			packet[3]+') </td>'+'<td width="45%" >'+ descr+' </td></tr>';
	}
	$('#headerTreeView tbody').append(tableRows);
}


function loadStixPacket(packetID, addToHeaderList=false)
{
	$('#rightloader').show();
	$.ajax({
		type:"GET",
		url:"/request/packet/id/"+packetID, 
		dataType:"json",
		success: function (data) {
			$('#rightloader').hide();
			displayPacket(data, DEFAULT_MAX_DEPTH);
			if(addToHeaderList){
				var headerData=[];
				var header=data[0]['header']
				headerData.push([data[0]['_id'], header['TMTC'],header['service_type'],header['service_subtype'],header['unix_time'],header['SPID'],header['name']])
				headerData={'status':'OK','data':headerData};
				displayStixHeaders(headerData);
			}
			$("#packetShare").attr("href","/view/packet/id/"+packetID);
			$('#shareLink').show();

		}
	});
}

$("#packetShare").on('click',function(e){
	e.preventDefault();
	var href= $('#packetShare').prop('href');
	var $temp = $("<input>");
	$("body").append($temp);
	$temp.val(href).select();
	document.execCommand("copy");
	$temp.remove();
	alert('URL has been copied to the clipboard!');
});

$("#download").on('click',function(e){
	e.preventDefault();
	if(window.packetIDList.length==0)
	{
		$('#msg').html('No packet to loaded!');
	}
	else
	{
		$('#msg').html('Downloading packets...');
		$.ajax({
			url: '/request/packets/ids',
			type:'POST',
			data:{'ids':window.packetIDList.join(',')},
			dataType:"json",
			success: function (data) {
				downloadJSON(data);
			}
		});
	}


});

var downloadJSON=function(jsonData){
	
	var data=new Blob([JSON.stringify(jsonData)], {type: "application/json"});
	var a = document.createElement('a');
	var url = window.URL.createObjectURL(data);
	a.href = url;
	var today = new Date();
	var y = today.getFullYear();
	// JavaScript months are 0-based.
	var m = today.getMonth() + 1;
	var d = today.getDate();
	var h = today.getHours();
	var mi = today.getMinutes();
	var s = today.getSeconds();
	var filename='stix_request_'+y + m + d + "_" + h +  mi +  s+'.json';
	a.download = filename;
	document.body.append(a);
	a.click();
	a.remove();
	window.URL.revokeObjectURL(url);
}


loadStixLatestPacketHeaders=function(service,num)
{
	$('#leftloader').show();
	$.ajax({
		url: '/request/headers/latest/0/200',
		dataType:"json",
		success: function (data) {
			$('#leftloader').hide();
			displayStixHeaders(data);
		}

	});
}


//})();
