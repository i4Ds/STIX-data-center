/*!
 * stix.packet.analyzer 0.1
 * Author: Hualin Xiao 
 */
//TODO  The packet reception time is used as timestamp. It has be to changed to packet time in the  future.
class StixPacketAnalyzer
{

	getRawInt(parameter){
		var	raw=-1;
		try{
			if(Array.isArray(parameter))
			{
				raw=parameter[1];
			}
			else
			{
				raw=parameter.raw;
			}
		}catch(e){
			raw=-1;
		}
		if (Array.isArray(raw)){
			return raw[0];
		}
		else{
			return raw;
		}

	}
	getChildren(parameter)
	{
		try{
			if(Array.isArray(parameter))
			{
				return parameter[3];
			}
			else
			{
				return parameter.children;
			}
		}catch(e){
			return [];
		}

	}
	getName(parameter)
	{
		try{
			if(Array.isArray(parameter))
			{
				return parameter[0];
			}
			else
			{
				return parameter.name;
			}
		}catch(e){
			return '';
		}
	}
	getEng(parameter)
	{
		try{
			if(Array.isArray(parameter))
			{
				return parameter[2];
			}
			else
			{
				return parameter.eng;
			}
		}catch(e){
			return -1;
		}

	}

	constructor()
	{
		this._parameters=[];
		this._parameter_vector={};
		this._header={};
	}

	convertRaw2Int(raw)
	{
		if (Array.isArray(raw)){
			return raw[0];
		}
		else{
			return raw;
		}
	}
	reset(){
		this._parameters=[];
		this._parameter_vector={};
		this._header={};
	}
	mergePackets(packets, SPIDs, default_value_type='eng')
	{
		var num = 0;
		var i;
		var packet;
		for(i=0;i<packets.length;i++)
		{
			packet=packets[i];
			if (! SPIDs.includes(packet['header']['SPID']))
			{
				continue;
			}
			this.merge(packet, default_value_type);
			num++;
		}
		return num;
	}
	getArray(name)
	{
		if( name in this._parameter_vector)
		{
			this._parameter_vector[name];
		}
		else
		{
			return [];
		}
	}

	merge( packet, default_value_type='eng')
	{
		var	parameters=packet['parameters'];
		var header=packet['header'];
		var i, param,name,rawValue, engValue, value;

		var unixTimestamp=header['unix_time'];
		if (!('unix_time' in this._parameter_vector))
		{
			this._parameter_vector['unix_time']=[unixTimestamp];
		}else
		{
			this._parameter_vector['unix_time'].push(unixTimestamp);
		}

		for(i=0;i <parameters.length;i++)
		{
			param=parameters[i];
			name=this.getName(param);
			if (name.includes('NIXG'))continue;
			value=this.getRawInt(param);

			engValue=this.getEng(param);
			if(default_value_type=='eng'){
				if(engValue!='' && !(typeof engValue ==='undefined'))
				{
					if (!isNaN(engValue))
					{
						value=engValue;
					}
				}
			}
			value=Number(value);

			if (name in this._parameter_vector)
			{
				this._parameter_vector[name].push(value);
			}
			else
			{
				this._parameter_vector[name]=[value];
			}
			var children=this.getChildren(param);
			if (children.length>0)
			{
				this.merge(children, default_value_type);
			}
		}
	}

	getAllParameters()
	{
		return this._parameter_vector;
	}



	load(packet)
	{
		this._parameters =packet['parameters'];
		this._header=packet['header'];
	}

	toArray(pattern,parameters=null, engParam='', traverseChildren=true, once=false)
	{
		/*
		pattern examples:
		pattern='NIX00159/NIX00146'
		return the values of all NIX00146 under NIX00159
		pattern='NIX00159/NIX00146/*'
		return the children's value of all NIX00146 
		dType is used to define whether retuning  raw or eng value

		*/

		var i;

		if(is.empty(pattern))return;
		if(!is.string(pattern))return;

		var pnames=pattern.split('/');
		var results=[];
		

		if (pnames.length==0)
		{
			return [];
		}

		var plist=parameters;
		if(plist==null)
		{
			plist=this._parameters;
		}

		var pname=pnames.shift();
		var ret=[];
		var rawValue, engValue;
		var length=plist.length;

		for(var i=0;i<length;i++)
		{
			var param=plist[i];
			var paramName=this.getName(param);
			if (paramName== pname || pname=='*')
			{
				if (pnames.length>0 && traverseChildren)
				{
					var newPattern=pnames.join('/');
					ret=this.toArray(newPattern,this.getChildren(param),   engParam, traverseChildren, once);
					if (ret.length>0)
					{
						results.push(ret);
					}
				}
				else{

					rawValue=this.getRawInt(param);
					engValue=this.getEng(param);
					if (engParam==pname)
					{
						results.push(engValue);
					}
					else{
						results.push(rawValue);
					}
					if(once)break;
				}

			}
		}
		return results;
	}
}

