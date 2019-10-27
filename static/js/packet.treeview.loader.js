
$("#packetTreeView").treetable({
	expandable:     true,
	onNodeExpand:   nodeExpand,
	onNodeCollapse: nodeCollapse
});

// expand node with ID "1" by default
$("#packetTreeView").treetable("reveal", '1');
// Highlight a row when selected
$("#packetTreeView tbody").on("mousedown", "tr", function() {
	$(".selected").not(this).removeClass("selected");
	$(this).toggleClass("selected");
});

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

var maxArrayElementDisplay=40;
var currentHeaderID=-1;



function displayParametersInPacketView(selector, parentId, parentNode, childNodes, packetId, level)
{

	var i=0;
	var nodeToAdd, row,newId;
	var length=0;
	if( !Array.isArray(childNodes)||childNodes.length==0)
	{
		return;
	}
	length=childNodes.length;
	childlength=length;
	if(level>0 &&length>maxArrayElementDisplay)
	{
		length=maxArrayElementDisplay;
	}
	var last_name='';
	var num_repeat=0;
	var same=false;
	for (var i = 0; i < length; i++) 
	{
		var node = childNodes[i];
		newId=parentId+'.'+i;
		nodeToAdd = $(selector).treetable("node",newId);
		same=false;
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


			row ='<tr  data-name="'+paramName+'"  data-tt-id="' + 
				newId + 
				'" data-tt-parent-id="' +
				parentId + '" ';
			if (Array.isArray(paramChildren) && paramChildren.length>0)
			{
				row += ' data-tt-branch="true" ';
			}
			row += ' >';

			//if(paramRaw)
			//{
			//	raw=paramRaw.toString();
			//}
			var engValue="";
			if(paramEng != undefined)
			{
				engValue=paramEng;
			}

			if(level>0 &&childlength>maxArrayElementDisplay && i==(maxArrayElementDisplay-1))
			{
				paramDescr='<a href="/request/packet/id/'+packetId+'"> more ...</a>'; 
				paramRaw='';
				//raw="";
				//	raw="";
			}
			row += "<td>" + paramName+ "</td>";
			row += "<td>" + paramDescr+ "</td>";
			row += "<td>" + paramRaw + "</td>";
			row += "<td>" + engValue+ "</td>";
			// End row
			row +="</tr>";
			$(selector).treetable("loadBranch", parentNode, row);

			if (Array.isArray(paramChildren) && paramChildren.length>0)
			{
				displayParametersInPacketView(selector, newId, nodeToAdd, paramChildren, packetId , level+1);

			} 
		}
	}
}


function displayPacket(data) 
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
	displayParametersInPacketView(selector, paramRootId, paramNode, parameters, packetId,0);
}

function displayStixHeaders(data)
{
	var packets=data["packets"];
	var status=data['status'];
	if(	status!="OK" && status!="TOO_MANY")
	{
		$('#msg').html(data['status']);
	}
	else
	{
		$('#msg').html('Total number of packets: '+packets.length);
	}

	for( var i=0; i< packets.length;i++){
		var packet=packets[i];
		var header=packet['header'];
		var timestamp=StixDateTime.unixTime2ISOstring(header['unix_time']);
		var tableRow='<tr id="' +packet._id+'" class="'+header.TMTC+' stype-'+header.service_type+" service-"+header.service_type+"-"+header.service_subtype+'">'+'<td width="10%">'+i+'</td><td width="20%" >'+ timestamp+ '</td><td width="10%" >'+header.TMTC+'('+header.service_type+','+header.service_subtype+') </td>'+'<td width="45%" >'+ header.descr +' </td></tr>';
		$('#headerTreeView').append(tableRow);
	}


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
			displayPacket(data);
			if(addToHeaderList){
				headerData={'status':'OK','packets':data};
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
