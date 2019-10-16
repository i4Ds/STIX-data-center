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


	SCET2ISOString: function(coarse_time, fine_time=0)
	{
		var unixtimestamp = coarse_time + fine_time / 65536. + SCET_OFFSET;
		return StixDateTime.unixTime2ISOstring(unixtimestamp);
	},
	resetUnixTimestamp:function(data)
	{
			var l=data.length;
			ts={};
			ts.T0=data[0];
			ts.T0_UTC=StixDateTime.unixTime2ISOstring(data[0]);
			ts.time=[];
			ts.time[0]=0;
			ts.hint=[];
			ts.hint[0]=ts.T0_UTC;
			for(var i=1;i<data.length;i++)
			{
				ts.time[i]=data[i]-data[0];
				ts.hint[i]=StixDateTime.unixTime2ISOstring(data[i]);
			}
			return ts;
	},

	resetSCET:function(data)
	{
			var l=data.length;
			ts={};
			ts.T0=data[0];
			ts.T0_UTC=StixDateTime.SCET2ISOString(data[0]);
			ts.time=[];
			ts.time[0]=0;
			ts.hint=[];
			ts.hint[0]=ts.T0_UTC;
			for(var i=1;i<data.length;i++)
			{
				ts.time[i]=data[i]-data[0];
				ts.hint[i]=StixDateTime.SCET2ISOString(data[i]);
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

