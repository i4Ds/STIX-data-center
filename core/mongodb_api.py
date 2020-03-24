#!/usr/bin/env python
# -*- encoding: utf-8 -*-
# @title        : MongoDB_api.py
# @description  : Mongodb web API
# @author       : Hualin Xiao
# @date         : May. 12, 2019
#import json
import datetime
from dateutil import parser as dtparser
from datetime import datetime
from datetime import timedelta
import pymongo

DEFAULT_MAX_PACKETS_RETURN = 20000
NUM_MAX_RETURN_PACKETS = 1000
NUM_MAX_RETURN_HEADERS = 20000
MAX_TABLE_NUM_ROWS = 500
MAX_REQUEST_LC_TIME_SPAN_DAYS = 3
MAX_TIME_SPAN_SECONDS = 7 * 24 * 3600

def to_list(spids):
    if isinstance(spids, int):
        return [
            spids,
        ]
    elif isinstance(spids, (list, tuple)):
        return spids
    return []

class _MongoDB(object):

    __instance = None

    @staticmethod
    def get_instance(app):
        if not _MongoDB.__instance:
            _MongoDB(app)
        return _MongoDB.__instance


    def __init__(self, app):
        print('creating instance')
        if _MongoDB.__instance:
            pass
        else:
            _MongoDB.__instance = self
        server='localhost'
        port=0
        user=''
        pwd=''
        if app:
            server = app.config['mongo_server']
            port = app.config['mongo_port']
            user = app.config['mongo_user']
            pwd = app.config['mongo_pwd']

        self.filename = None
        self.packets = []
        self.db = None
        self.collection_packets = None
        self.collection_raw_files = None
        self.collection_calibration = None
        try:
            if server == 'localhost' and user == '' and pwd == '':
                self.connect = pymongo.MongoClient(server, port)
            else:
                self.connect = pymongo.MongoClient(
                    server,
                    port,
                    username=user,
                    password=pwd,
                    authSource='stix')
            self.db = self.connect["stix"]
            self.collection_packets = self.db['packets']
            self.collection_raw_files = self.db['raw_files']
            self.collection_calibration = self.db['calibration_runs']
            self.collection_qllc = self.db['ql_lightcurves']
            self.collection_qlbkg = self.db['ql_background']
            self.collection_IORs= self.db['IORs']
        except Exception as e:
            print(str(e))



    def get_field_selector(self, header_only):
        if header_only:
            return {'header': 1}
        return None

    def get_run_info(self, run_id):
        if self.collection_raw_files:
            cursor = self.collection_raw_files.find({'_id': int(run_id)})
            for x in cursor:
                return x
        return None

    def get_filename_of_run(self, run_id):
        if self.collection_raw_files:
            cursor = self.collection_raw_files.find({'_id': int(run_id)})
            for x in cursor:
                return x['filename']
        return ''

    def select_packet_by_id(self, _id, header_only=False):
        if self.collection_packets:
            cursor = self.collection_packets.find(
                {'_id': int(_id)}, self.get_field_selector(header_only))
            return cursor
        return []
    def select_packets_by_ids(self, _ids):
        if self.collection_packets:
            cursor = self.collection_packets.find(
                    {'_id': {'$in':_ids}})
            return cursor
        return []




    def select_packets_by_services(self,
                                   services,
                                   start_unix,
                                   delta_time_seconds,
                                   header_only=False):
        """
        fetch packets by service type in the given time window
        """

        services = to_list(services)
        if services == []:
            return 'INVALID_SERVICES', []
        end_unix = start_unix + delta_time_seconds
        status = 'OK'
        data = []
        if self.collection_packets:
            query_string = {
                '$and': [{
                    'header.service_type': {
                        '$in': services
                    }
                }, {
                    'header.unix_time': {
                        '$gte': start_unix,
                        '$lt': end_unix
                    }
                }]
            }
            num_max = NUM_MAX_RETURN_PACKETS
            if header_only:
                num_max = NUM_MAX_RETURN_HEADERS
            fields = self.get_field_selector(header_only)
            cursor = self.collection_packets.find(query_string,
                                                  fields).limit(num_max).sort(
                                                      '_id', 1)
        
            if num_max == cursor.count():
                status = 'TOO_MANY'

        return status, cursor

    def select_telecommand_packets(self,
                                   start_unix,
                                   delta_time_seconds,
                                   header_only=False):
        """
        fetch packets by service type in the given time window
        """

        end_unix = start_unix + delta_time_seconds
        status = 'OK'
        data = []
        if self.collection_packets:
            query_string = {
                '$and': [{
                    'header.TMTC': 'TC'
                }, {
                    'header.unix_time': {
                        '$gte': start_unix,
                        '$lt': end_unix
                    }
                }]
            }
            num_max = NUM_MAX_RETURN_PACKETS
            if header_only:
                num_max = NUM_MAX_RETURN_HEADERS
            fields = self.get_field_selector(header_only)
            cursor = self.collection_packets.find(query_string,
                                                  fields).limit(num_max).sort(
                                                      '_id', 1)
            if num_max == cursor.count():
                status = 'TOO_MANY'
        return status, cursor

    def select_packets_by_run(self, run_id, SPIDs=[], header_only=False):
        status = "OK"
        data = []
        if self.collection_packets:
            num_max = NUM_MAX_RETURN_PACKETS
            if header_only:
                num_max = NUM_MAX_RETURN_HEADERS
            fields = self.get_field_selector(header_only)
            query_string = {'run_id': int(run_id)}
            if SPIDs:
                query_string = {
                    '$and': [{
                        'run_id': int(run_id)
                    }, {
                        'header.SPID': {
                            '$in': SPIDs
                        }
                    }]
                }
            cursor = self.collection_packets.find(query_string,
                                                  fields).limit(num_max)
            if cursor.count() == num_max:
                status = 'TOO_MANY'
        return status, cursor

    def select_packets_by_calibration(self, calibration_id, header_only=False):
        status = "OK"
        data = []
        if self.collection_calibration and self.collection_packets:
            cursor = self.collection_calibration.find(
                {'_id': int(calibration_id)}, {'packet_ids': 1})
            run = list(cursor)
            if run:
                packet_ids = run[0]['packet_ids']
                fields = self.get_field_selector(header_only)
                data = self.collection_packets.find(
                    {'_id': {
                        '$in': packet_ids
                    }}, fields)
        return status, data

    def select_packets_by_SPIDs(self,
                                spids,
                                start_unix,
                                delta_time_seconds,
                                header_only=False):
        """
        fetch packets by SPIDs in the given time window
        """
        spids = to_list(spids)
        if spids == []:
            return 'INVALID_SPID', []

        end_unix = start_unix + delta_time_seconds
        if self.collection_packets:
            query_string = {
                '$and': [{
                    'header.SPID': {
                        '$in': spids
                    }
                }, {
                    'header.unix_time': {
                        '$gte': start_unix,
                        '$lt': end_unix
                    }
                }]
            }
            num_max = NUM_MAX_RETURN_PACKETS
            if header_only:
                num_max = NUM_MAX_RETURN_HEADERS
            fields = self.get_field_selector(header_only)

            cursor = self.collection_packets.find(query_string,
                                                  fields).limit(num_max).sort(
                                                      '_id', 1)
            data = cursor
            status = 'OK'
            if cursor.count() == NUM_MAX_RETURN_PACKETS:
                status = 'TOO_MANY'

            return status, data
        else:
            return 'OK', []

    def select_last_packets(self, spids, start_unix_time, span_seconds):
        if span_seconds > MAX_TIME_SPAN_SECONDS:
            span_seconds = MAX_TIME_SPAN_SECONDS
        spids = to_list(spids)
        if spids == []:
            return 'INVALID_SPID', []
        end_unix_time = start_unix_time + span_seconds
        if self.collection_packets:
            query_string = {
                '$and': [{
                    'header.SPID': {
                        '$in': spids
                    }
                },
                         {
                             'header.unix_time': {
                                 '$gte': start_unix_time,
                                 '$lt': end_unix_time
                             }
                         }]
            }
            cursor = self.collection_packets.find(query_string).sort(
                '_id', 1).limit(NUM_MAX_RETURN_PACKETS)
            status = 'OK'
            if cursor.count() == NUM_MAX_RETURN_PACKETS:
                status = 'TOO_MANY'
            return status, cursor
        else:
            return 'OK', []

    def select_last_packet_headers_by_service_type(self, service_type,
                                                   num=100):
        status="OK"
        data=[]
        if num > 1000:
            status="TOO_MANY"
            return result,data
        query_string = {}
        if int(service_type) > 0:
            query_string = {'header.service_type': int(service_type)}

        if self.collection_packets:
            cursor = self.collection_packets.find(query_string, {
                'header': 1
            }).sort('_id', -1).limit(num)
            data = cursor
        return status,data

    def close(self):
        if self.connect:
            self.connect.close()

    def get_latest_file_list(self):
        if self.collection_raw_files:
            runs = self.collection_raw_files.find().sort(
                '_id', -1).limit(20)
            return runs
        return []
    def get_num_processing_runs(self):
        num=0
        if self.collection_raw_files:
            num= self.collection_raw_files.count()
        return num
    def get_processing_runs(self, start, num):
        runs=[]
        if self.collection_raw_files:
            if start > 0:
                runs= list(self.collection_raw_files.find().skip(start).limit(num))
            elif start < 0:
                runs= list( self.collection_raw_files.find().sort('_id',-1).limit(num))

            for run in runs:
                self.attach_calibration_run_info(run)
        return runs

    def attach_calibration_run_info(self, run):
        calibration_ids=self.get_calibration_run_ids_by_fid(run['_id'])
        run['num_calibration']=len(calibration_ids)
        #run['calibration_runs']=calibration_ids

    def select_processing_runs_by_tw(self, start_unix, stop_unix):
        start_unix_time=float(start_unix)
        stop_unix_time=float(stop_unix)
        runs = []
        if self.collection_raw_files:
            query_string = {'$or':[{
                'data_start_unix_time':
                {  #Need tO be changed to SCET in the future
                    '$gte': start_unix_time,
                    '$lt': stop_unix_time
                }
            },{
                'data_stop_unix_time':
                {  #Need tO be changed to SCET in the future
                    '$gte': start_unix_time,
                    '$lt': stop_unix_time
                }
                }]}

            runs = list(self.collection_raw_files.find(query_string).limit(MAX_TABLE_NUM_ROWS))
            for run in runs:
                self.attach_calibration_run_info(run)
        return runs



    def select_detector_tests_by_tw(self, start_unix_time, span_seconds):
        runs = []
        status = 'OK'
        if self.collection_packets:
            query_string = {'$and':
                    [{
                'header.unix_time':
                {  #Need tO be changed to SCET in the future
                    '$gte': start_unix_time,
                    '$lt': span_seconds + start_unix_time
                }},
                 {
                     'header.SPID':{'$in':[54132, 54133, 54134, 54130]}
                     
                    }]
            }
            #print(query_string)
            runs= self.collection_packets.find(
                query_string, {
                    '_id': 1,
                    'header.unix_time': 1,
                    'header.SPID': 1,
                    'header.seg_flag': 1,
                    'header.descr': 1
                }).sort('_id', -1).limit(MAX_TABLE_NUM_ROWS)

        if runs.count() == MAX_TABLE_NUM_ROWS:
            status = "TOO_MANY"

        return status, runs

    def get_detector_test_report(self, packet_id, which):
        """
        get a detector test report by id
         which ==0 : exact packet
         which == 1 :next one
         which == -1 : previous one
         id == -1 : last one
         """
        pkts= []
        query_string = ''
        packet_id=int(packet_id)
        which=int(which)
        detector_test_report_spids=[54132, 54133, 54134, 54130]
        if self.collection_packets:
            if packet_id >= 0 and which==0:
                query_string={'_id':packet_id}
            elif packet_id >= 0 and which == -1:
                #previous one
                query_string = {'$and':
                    [{
                '_id':{ '$lt': packet_id}},
                 {
                     'header.SPID':{'$in':detector_test_report_spids}
                    }]}
            elif packet_id >= 0 and which == 1:
                query_string = {'$and':
                    [{
                '_id':{ '$gt': packet_id}},
                 {
                     'header.SPID':{'$in':detector_test_report_spids}
                    }]}
            elif packet_id == -1:
                query_string={'header.SPID':{'$in':detector_test_report_spids}}

            if query_string:
                packet= list(self.collection_packets.find(query_string).sort('_id',-1).limit(1))
                if not packet:
                    return []
                pkts.extend(packet)
                packet_id=packet[0]['_id']
                if packet[0]['header']['seg_flag'] in [0,2]:
                    packet2=self.get_detector_test_report(packet_id, -1)
                    pkts.extend(packet2)
                

        return pkts



    def get_num_calibration_runs_fid(self, file_id):
        num=0
        if self.collection_calibration:
            query_string = {
                    'run_id':int(file_id)
            }
            num = self.collection_calibration.find(
                query_string).count()
        return num


    def get_calibration_run_ids_by_fid(self, file_id):
        ids= []
        if self.collection_calibration:
            query_string = {
                    'run_id':int(file_id)
            }
            result= self.collection_calibration.find(
                    query_string,{'spectra':0}).sort('_id', 1)
            ids=list(result)
        return ids


    def select_calibration_runs_by_tw(self, start_unix_time, span_seconds):
        runs = []
        status = 'OK'
        if self.collection_calibration:
            query_string = {
                'header_unix_time':
                {  #Need tO be changed to SCET in the future
                    '$gte': start_unix_time,
                    '$lt': span_seconds + start_unix_time
                }
            }
            runs = self.collection_calibration.find(
                query_string, {
                    'run_id': 1,
                    'header_unix_time': 1,
                    'start_unix_time': 1,
                    'duration': 1
                }).sort('_id', -1).limit(MAX_TABLE_NUM_ROWS)
        if runs.count() == MAX_TABLE_NUM_ROWS:
            status = "TOO_MANY"
        return status, runs


    def get_calibration_spectra(self, calibration_id):
        _id = int(calibration_id)
        rows = []
        if self.collection_calibration and _id >= 0:
            rows = self.collection_calibration.find({'_id': _id},{'spectra':1})
        return rows



    def get_calibration_run_info(self, calibration_id):
        _id = int(calibration_id)

        rows = []
        if self.collection_calibration:
            if _id == -1:
                rows = self.collection_calibration.find({},{'spectra':0}).sort('_id',
                                                               -1).limit(1)
            elif _id >= 0:
                rows = self.collection_calibration.find({'_id': _id},{'spectra':0})

        return rows

    def get_run_ql_pdf(self, _id):
        if self.collection_raw_files:
            run = self.collection_raw_files.find_one({'_id': _id})
            if 'quicklook_pdf' in run:
                return run['quicklook_pdf']
        return None

    def get_quicklook_packets(self, packet_type, start_unix_time, span):
        span = float(span)
        start_unix_time = float(start_unix_time)
        if span > 3600 * 24 * MAX_REQUEST_LC_TIME_SPAN_DAYS:  #max 3 days
            return []
        stop_unix_time = start_unix_time + span
        collection = None
        if packet_type == 'lc':
            collection = self.collection_qllc
        elif packet_type == 'bkg':
            collection = self.collection_qlbkg
        elif packet_type=='qlspec':
            collection = self.collection_packets
            query_string = {'$and':
                    [
                        {'header.SPID': 54120},
                        {'header.unix_time': {'$gte':start_unix_time, '$lt':stop_unix_time}}
                    ]}
            cursor = self.collection_packets.find(query_string).sort('_id', 1)
            return cursor
        else:
            return []

        if not collection:
            return []
        query_string = {
            "$and": [{
                'stop_unix_time': {
                    '$gt': start_unix_time
                }
            }, {
                'start_unix_time': {
                    '$lt': stop_unix_time
                }
            }]
        }
        ret = collection.find(query_string, {'packet_id': 1}).sort('_id', 1)
        packet_ids = [x['packet_id'] for x in ret]
        if packet_ids:
            query_string = {'_id': {'$in': packet_ids}}
            cursor = self.collection_packets.find(query_string).sort('_id', 1)
            return cursor
        return []
    def get_quicklook_packets_of_run(self, packet_type, run):
        collection = None
        if packet_type =='qlspec':
            collection = self.collection_packets
            query_string = {'run_id': run, 'header.SPID':54120}
            cursor = self.collection_packets.find(query_string).sort('_id', 1)
            return cursor



        if packet_type == 'lc':
            collection = self.collection_qllc
        elif packet_type == 'bkg':
            collection = self.collection_qlbkg
        else:
            return []

        if not collection:
            return []
        query_string = {'run_id':run}
        ret = collection.find(query_string, {'packet_id': 1}).sort('_id', 1)
        packet_ids = [x['packet_id'] for x in ret]
        if packet_ids:
            query_string = {'_id': {'$in': packet_ids}}
            cursor = self.collection_packets.find(query_string).sort('_id', 1)
            return cursor
        return []


    def get_last_lightcurve_packets(self):
        if not self.collection_qllc:
            return []
        ret = self.collection_qllc.find({}, {
            'packet_id': 1
        }).sort('_id', -1).limit(1)
        packet_ids = [x['packet_id'] for x in ret]
        if packet_ids:
            query_string = {'_id': {'$in': packet_ids}}
            cursor = self.collection_packets.find(query_string).sort('_id', 1)
            return cursor
        return []

    def get_last_packet_unix_time(self, spids):
        spids = to_list(spids)
        if spids == []:
            return -1
        if self.collection_packets:
            query_string = {'header.SPID': {'$in': spids}}
            cursor = self.collection_packets.find(query_string, {
                'header': 1
            }).sort('header.unix_time', -1).limit(1)
            packet = list(cursor)
            if packet:
                return packet[0]['header']['unix_time']
        return -1

    def select_operation_request_by_id(self,fid):
        if self.collection_IORs:
            cursor = self.collection_IORs.find({'_id':int(fid)})
            return cursor
        return []
    def select_operation_request_by_tw(self,start=0, stop=2524521600, generation_time=True):
        #gen: generation time
        #
        iors= []
        field='genUnix'
        if not generation_time:
            field='startUnix'

        if self.collection_IORs:
            query_string = {
                field:
                {  #Need tO be changed to SCET in the future
                    '$gte': start,
                    '$lt':stop 
                }
            }
            iors= self.collection_IORs.find(
                query_string, {
                    '_id': 1,
                    'filename': 1,
                    'genUnix': 1,
                    'startUnix': 1,
                    'stopUnix': 1,
                    'phase': 1,
                    'description': 1
                }).sort('_id', -1).limit(MAX_TABLE_NUM_ROWS)
        return iors 
    def select_last_operation_request_info(self, num=50):
        if not self.collection_IORs:
            return []
        if self.collection_IORs:
            iors= self.collection_IORs.find(
                    {}, {
                    '_id': 1,
                    'filename': 1,
                    'genUnix': 1,
                    'startUnix': 1,
                    'stopUnix': 1,
                    'phase': 1,
                    'description': 1
                }).sort('_id', -1).limit(num)
            return iors



            
def MongoDB(app=None):
    return _MongoDB.get_instance(app)


if __name__ == '__main__':
    from flask import Flask
    import pprint
    app = Flask(__name__)
    app.config['mongo_server'] = 'localhost'
    app.config['mongo_port'] = 27017
    app.config['mongo_user'] = ''
    app.config['mongo_pwd'] = ''

    mdb = MongoDB(app)
    #pprint.pprint(mdb.get_last_packet_unix_time(54102))
    #pprint.pprint(mdb.select_detector_tests_by_tw(0,1e9))
    pprint.pprint(mdb.get_num_processing_runs())
    #pprint.pprint(list(mdb.get_processing_runs(0, 20)))
    pprint.pprint(list(mdb.select_processing_runs_by_tw(0, 1e10)))

