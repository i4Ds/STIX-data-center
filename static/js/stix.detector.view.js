var StixDetectorView={
	detectorP0:[[	135	,	222.5	],
[	135	,	337.5	],
[	135	,	472.5	],
[	135	,	587.5	],
[	260	,	107.5	],
[	260	,	222.5	],
[	260	,	337.5	],
[	260	,	472.5	],
[	260	,	587.5	],
[	260	,	702.5	],
[	385	,	37.5	],
[	385	,	152.5	],
[	385	,	267.5	],
[	385	,	542.5	],
[	385	,	657.5	],
[	385	,	772.5	],
[	510	,	37.5	],
[	510	,	152.5	],
[	510	,	267.5	],
[	510	,	542.5	],
[	510	,	657.5	],
[	510	,	772.5	],
[	635	,	107.5	],
[	635	,	222.5	],
[	635	,	337.5	],
[	635	,	472.5	],
[	635	,	587.5	],
[	635	,	702.5	],
[	760	,	222.5	],
[	760	,	337.5	],
[	760	,	472.5	],
[	760	,	587.5	]],
	plotOneDector: function(detectorID=0, colors=[], data=[]){
		var startX=this.detectorP0[detectorID][0];
		var startY=this.detectorP0[detectorID][1];
		var bigPixelTop = 'h 22 v 46 h -11 v -4.5 h -11 Z';
		var bigPixelBottom = 'h 22 v -46 h -11 v 4.5 h -11 Z';
		var smallPixelPath = 'h 11 v 9 h -11  Z';
		var guardRingStyle= "fill:rgb(255,255,255);stroke-width:1;stroke:rgb(0,0,0)" ;
		var pixelP0=[[6,4],
			[28,4],
			[50,4],
			[72,4],
			[6,96],
			[28,96],
			[50,96],
			[72,96],
			[6.0,45.5],
			[28.0,45.5],
			[50.0,45.5],
			[72.0,45.5]];
		var paths='';
		var x;
		var y;
		x=startX+40;
		y=startY+110;
		paths+= '<text x="'+x+'" y="'+y+'" > #'+(detectorID+1)+' </text>';

		paths+='<rect x="'+startX+'" y="'+startY+'" width="100" height="100"  style="'+guardRingStyle+'" />';
		for(var i=0;i<12;i++)
		{
			var path='';
			x=startX+pixelP0[i][0];
			y=startY+pixelP0[i][1];
			if(i<4){
				path='M'+x+' '+y+' '+bigPixelTop;
			}
			else if(i<8)
			{
				path='M'+x+' '+y+' '+bigPixelBottom;
			}
			else{
				path='M'+x+' '+y+' '+smallPixelPath;

			}
			var color='rgb(250,250,250)';
			if (colors.length>0)
			{
				color=colors[i];
			}
			var pixelData='';
			if (data.length>0)
			{
				pixelData="Counts: "+data[detectorID*12+i];
			}
			var pixelStyle="fill:"+color+";stroke-width:1;stroke:rgb(0,0,0)" ;
			paths+=  ' <path class="pixel" onClick="loadPixelData('	+detectorID+','+i
				+')"  id="det-'+(detectorID+1)+'-'+i+ '" style="'+pixelStyle+'"   d="'+path+'" > <title> '+ pixelData +' </title>		</path>';
		}
		return paths;
	},
	createColorBar:function(X0,Y0, W,L, maxValue ){
		var path='';
		path+='<rect x="'+X0+'" y="'+Y0+'" width="'+W+'" height="'+L+'"  style="fill:rgb(250,250,250); stroke-width:0;stroke:rgb(0,0,255)" />';
		var num=StixCommon.viridis.length;
		for(var i=0;i<num;i++)
		{
			var	dL=W/num;
			var	x=dL*i+X0;
			var y=Y0;
			path+='<rect x="'+x+'" y="'+y+'" width="'+dL+'" height="'+L+'"  style="fill:'+StixCommon.viridis[i][1]+'; stroke-width:1;stroke:'+StixCommon.viridis[i][1]+'" />';
		}
		var numTicks=10;
		for(var i=0;i<=numTicks;i++)
		{
			dL=W/numTicks;
			var	x=dL*i+X0-10;
			var y=Y0-20;
			path+= '<text x="'+x+'" y="'+y+'" > '+parseInt(i*maxValue/numTicks,10)+' </text>';
		}
		return path;
	},



	plotDector : function (selector,counts=[]){
		//counts is a 32*12 array containing data or empty
		$(selector).html('');
		var frameStyle="fill:rgb(255,255,255); stroke-width:3;stroke:rgb(0,0,255)";
		var groupFrameStyle="stroke-width:3;stroke:rgb(0,0,250)" ;
		var html=	  '     <svg id="detector-view" width="1005" height="1105" viewBox="0 0 1600 1700" >\
			<circle  \
		style="opacity:0.1;fill:#0000ff;stroke:#0000ff;stroke-width:1.046;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" \
		cx="502.5" \
		cy="460.0" \
		r="450"/> \
			<path  style="stroke-width:3;stroke:rgb(0,0,250)"  d="M500.5 10.0 L500.5 910.0 " /> \
			<path  style="stroke-width:3;stroke:rgb(0,0,250)"  d="M52.5 460.0 L952.5 460.0" /> \
			<circle \
		style="opacity:0.95999995;fill:#222b00;stroke:#0000ff;stroke-width:1.046;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" \
		id="path5204" \
		cx="502.5" \
		cy="460.0" \
		r="70" />'


		var maxValue=Math.max(...counts);
		 maxValue=Math.ceil(maxValue/100.)*100;

		html+=this.createColorBar(10,1000,1000,30,maxValue);
		for (var i=0;i<32;i++)
		{
			var colors=[];
			for (var j =0;j<12;j++){
				colors.push('rgb(253,253,253)');
				if(counts.length>0 && counts[i*12+j]>=1)
				{
					if (maxValue>0)
					{
						colors[j]=StixCommon.getColor(counts[i*12+j]/maxValue);
					}
				}

			}
			html+= this.plotOneDector(i, colors, counts);
		}
		$(selector).append(html);
	},

};


