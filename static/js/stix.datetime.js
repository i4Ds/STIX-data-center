/*!
 * stix.datatime..0.1
 * Author: Hualin Xiao 
 */
var SCET_OFFSET=946684800.;

var StixDateTime={

	unixTime2ISOstring: function(unix)
	{
		var ts=new Date(unix*1000.);//.toISOString().slice(0,20);
		return ts.toISOString();
	},
	utc2unix: function(utc)
	{
		if(!utc.endsWith('Z'))
		{
			utc=utc+'Z';
		}
		var ts=Date.parse(utc)/1000.;
		return ts;
	},

	parseDBUTC: function(db_timestamp)
	{
	   if(is.object(db_timestamp))
		 {
			 return db_timestamp['$date'];
		 }
		else if(is.number(db_timestamp))
		{
			return db_timestamp;
		}
		else if(is.string(db_timestamp))
		{
			return this.utc2unix(db_timestamp);
		}
		else{
			return 0;
		}

	},
	
	SCET2Unixtime: function(coarse_time,fine_time=0)
	{
		return coarse_time + fine_time / 65536. + SCET_OFFSET;
	},

	SCETArray2UnixTimeArray: function(scet, T0=0)
	{
		var unixTimeArray=[];
		for(var i =0; i<scet.length;i++)
		{
			unixTimeArray[i]=scet[i] + SCET_OFFSET-T0;
		}
		return unixTimeArray;
	},
	SCETArray2ISOStringArray: function(scet)
	{
		var utcTimeArray=[];
		for(var i =0; i<scet.length;i++)
		{
			utcTimeArray[i]=this.SCET2ISOString(scet[i]);
		}
		return utcTimeArray;
	},




	SCET2ISOString: function(coarse_time, fine_time=0)
	{
		var unixtimestamp = coarse_time + fine_time / 65536. + SCET_OFFSET;
		return StixDateTime.unixTime2ISOstring(unixtimestamp);
	},
	formatUnixTimeAxis:function(data)
	{
			var l=data.length;
			ts={};
			ts.T0=data[0];
			ts.T0_UTC=StixDateTime.unixTime2ISOstring(data[0]);
			ts.unixTime=[];
			ts.unixTime[0]=0;
			ts.utc=[];
			ts.utc[0]=ts.T0_UTC;
			//ts.SCET=[];
			for(var i=1;i<data.length;i++)
			{
				ts.unixTime[i]=data[i]-data[0];
				//ts.SCET[i]=data[i]-SCET_OFFSET;
				ts.utc[i]=StixDateTime.unixTime2ISOstring(data[i]);
			}
			return ts;
	},

	


	getUTCArray:function(timestamps)
	{
		var t=[];
		var realtime;
		var T0=timestamps[0];
		for(var i=1;i<timestamps.length;i++)
		{
			realtime= T0 +timestamps[i];
			t[i]=StixDateTime.unixTime2ISOstring(realtime);
		}

		return t;
	}

};

