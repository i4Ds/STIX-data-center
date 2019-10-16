#!/usr/bin/env python
# -*- encoding: utf-8 -*-
# @title        : MongoDB.py
# @description  : Mongodb reader
# @author       : Hualin Xiao
# @date         : May. 12, 2019
#import json
import datetime
import pymongo
from dateutil import parser as dtparser
from datetime import datetime
from datetime import timedelta

DEFAULT_MAX_PACKETS_RETURN = 20000
NUM_MAX_RETURN_PACKETS = 1000
NUM_MAX_RETURN_HEADERS = 20000
MAX_TABLE_NUM_ROWS=500


def to_list(spids):
    if isinstance(spids, int):
        return [
            spids,
        ]
    elif isinstance(spids, (list, tuple)):
        return spids
    return []


class MongoDB(object):
    def __init__(self, app):
        server=app.config['mongo_server']
        port=app.config['mongo_port']
        user=app.config['mongo_user']
        pwd=app.config['mongo_pwd']
        self.filename = None
        self.packets = []
        self.db = None
        self.collection_packets = None
        self.collection_runs = None
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
            self.collection_runs = self.db['processing_runs']
            self.collection_calibration = self.db['calibration_runs']
        except Exception as e:
            print(str(e))

    def get_field_selector(self, header_only):
        if header_only:
            return {'header': 1}
        return None

    def get_run_info(self, run_id):
        if self.collection_runs:
            cursor = self.collection_runs.find({'_id': int(run_id)})
            for x in cursor:
                return x
        return None

    def get_filename_of_run(self, run_id):
        if self.collection_runs:
            cursor = self.collection_runs.find({'_id': int(run_id)})
            for x in cursor:
                return x['filename']
        return ''

    def select_packet_by_id(self, _id, header_only=False):
        if self.collection_packets:
            cursor = self.collection_packets.find(
                {'_id': int(_id)}, self.get_field_selector(header_only))
            return list(cursor)
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
            data = list(cursor)
            if num_max == len(data):
                status = 'TOO_MANY'

        return status, data

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
            data = list(cursor)
            if num_max == len(data):
                status = 'TOO_MANY'
        return status, data

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
            data = list(cursor)
            if len(data) == num_max:
                status = 'TOO_MANY'
        return status, data

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
                data = list(
                    self.collection_packets.find({'_id': {
                        '$in': packet_ids
                    }}, fields))
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
            data = list(cursor)
            status = 'OK'
            if len(data) == NUM_MAX_RETURN_PACKETS:
                status = 'TOO_MANY'

            return status, data
        else:
            return 'OK', []


    def select_last_packets_by_SPIDs(self, spids, num=200):
        if num > NUM_MAX_RETURN_PACKETS:
            num = NUM_MAX_RETURN_PACKETS

        spids = to_list(spids)
        if spids == []:
            return 'INVALID_SPID', []

        if self.collection_packets:
            query_string = {'header.SPID': {'$in': spids}}
            cursor = self.collection_packets.find(query_string).sort(
                '_id', -1).limit(num)
            data = list(cursor)
            status = 'OK'
            if len(data) == NUM_MAX_RETURN_PACKETS:
                status = 'TOO_MANY'
            return status, data
        else:
            return 'OK', []

    def select_last_packet_headers_by_service_type(self, service_type,
                                                   num=100):
        if self.collection_packets:
            cursor = self.collection_packets.find(
                {
                    'header.service_type': int(service_type)
                }, {
                    'header': 1
                }).sort('_id', -1).limit(num)
            return list(cursor)
        else:
            return []

    def close(self):
        if self.connect:
            self.connect.close()

    def select_all_processing_runs(self):
        if self.collection_runs:
            runs = list(self.collection_runs.find().sort(
                '_id', -1).limit(DEFAULT_MAX_PACKETS_RETURN))
            return runs
        return []

    def select_calibration_runs_by_tw(self, start_unix_time, span_seconds):
        runs=[]
        status='OK'
        if self.collection_calibration:
            query_string={
                    'header_unix_time': { #Need tO be changed to SCET in the future
                        '$gte': start_unix_time,
                        '$lt':span_seconds+start_unix_time 
                    }
                }
            runs = list(
                self.collection_calibration.find(query_string, {
                    'run_id': 1,
                    'header_unix_time': 1,
                    'start_unix_time': 1,
                    'duration': 1
                }).sort('_id', -1).limit(MAX_TABLE_NUM_ROWS))
        if len(runs)==MAX_TABLE_NUM_ROWS:
            status="TOO_MANY"
        return status,runs

    def get_calibration_run_info(self, calibration_id):
        _id=int(calibration_id)
        
        rows=[]
        if self.collection_calibration:
            if _id==-1:
                rows = list(self.collection_calibration.find().sort('_id',-1).limit(1))
            elif _id>=0:
                rows = list(self.collection_calibration.find({'_id': _id}))

        return rows
    def get_run_ql_pdf(self, _id):
        if self.collection_runs:
            run = self.collection_runs.find_one({'_id': _id})
            if 'quicklook_pdf' in run:
                return run['quicklook_pdf']
        return None



if __name__ == '__main__':
    mdb = MongoDB()
    print(mdb.select_packets_by_calibration(0))
