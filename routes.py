#!/usr/bin/env python3
# -*- encoding: utf-8 -*-
#TODO:
#  - add paginations for telemetry file  list view
# -- using flask blueprint

import os
from flask import Flask, jsonify, render_template, request, session, abort, redirect, flash, Response, url_for, abort, json, send_from_directory, abort
from werkzeug.utils import secure_filename
from datetime import datetime
from dateutil import parser as dtparser
from bson import json_util
import pprint

from core import mongodb_api
from core import desc

app = Flask(__name__)
app.config['mongo_server'] = 'localhost'
app.config['mongo_port'] = 27017
app.config['mongo_user'] = ''
app.config['mongo_pwd'] = ''

STIX_MDB = mongodb_api.MongoDB(app)

def convert_to_unix_time(timestamp):
    dt = None
    if isinstance(timestamp, float):
        return timestamp
    elif isinstance(timestamp, str):
        try:
            ts = float(timestamp)
            return ts
        except ValueError:
            dt = dtparser.parse(timestamp)
    elif isinstance(timestamp, datetime.datetime):
        dt = timestamp
    if dt:
        return dt.timestamp()
    return 0


def get_group_spids(packet_type):
    if packet_type not in ['hk', 'qllc', 'qlbkg', 'qlspec', 'scil0', 'cal']:
        return []
    if packet_type == 'hk':
        SPIDs = [54102, 54101]
    elif packet_type == "cal":
        SPIDs = [
            54124,
        ]
    elif packet_type == "qllc":
        SPIDs = [
            54118,
        ]
    elif packet_type == "qlbkg":
        SPIDs = [
            54119,
        ]
    elif packet_type == "qlspec":
        SPIDs = [
            54120,
        ]
    elif packet_type == "scil0":
        SPIDs = [
            54114,
        ]
    return SPIDs


@app.template_filter('to_hex')
def _jinja2_filter_to_hex(value, fmt=None):
    try:
        return hex(value)
    except TypeError:
        return value


@app.template_filter('strftime')
def _jinja2_filter_datetime(unix_time, fmt=None):
    return datetime.utcfromtimestamp(unix_time).strftime('%Y-%m-%dT%H:%M:%SZ')


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


def view_packet_of_file(file_id):
    return render_template('packet-request.html', file_id=file_id)


class JSONEncoder(json.JSONEncoder):
    ''' extend json-encoder class'''

    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime.datetime):
            return str(o)
        return json.JSONEncoder.default(self, o)


@app.route("/test")
def test():
    return render_template('test.html')


@app.route("/")
def main():
    return render_template('index.html')


@app.route("/view/list/files")
def view_filelist():
    runs = STIX_MDB.select_all_processing_runs()
    return render_template('list-files.html', runs=runs)




@app.route('/view/calibration/configuration/<int:calibration_id>')
def view_calibration_configuration(calibration_id):
    data = STIX_MDB.get_calibration_run_info(calibration_id)
    return render_template('calibration-info-in-modal.html', data=data)


@app.route('/view/packet/calibration/<int:calibration_id>')
def view_calibration_packets(calibration_id):
    return render_template(
        'packet-request.html', calibration_id=calibration_id)


@app.route("/view/packet/file/<file_id>")
def view_packets_of_file(file_id):
    return view_packet_of_file(file_id)


@app.route("/plot/calibration/", defaults={'calibration_id': -1})
@app.route("/plot/calibration/<int:calibration_id>")
def view_calibration(calibration_id):
    message = 'Requesting data of calibration run # {}'.format(calibration_id)
    if calibration_id == -1:
        message = 'Requesting data of last calibration run info'
    return render_template(
        'plot-calibration.html',
        calibration_id=calibration_id,
        message=message)

@app.route("/plot/lightcurves", methods=['GET'])
def view_lightcurves():
    start_unix=0
    span_seconds=0
    try:
        start_unix = float(request.values['start'])
        span_seconds = float(request.values['span'])
    except:
        pass
    return render_template(
        'plot-lightcurves.html',
        start_unix=start_unix,
        span_seconds=span_seconds)




@app.route("/view/packet/id/<int:packet_id>")
def view_packet_of_id(packet_id):
    return render_template('packet-request.html', packet_id=packet_id)


@app.route("/view/packet/request")
def view_request_form():
    return render_template('packet-request.html', packet_id=-1)


@app.route("/plot/housekeeping/file/<int:file_id>")
def view_file_housekeeping(file_id):
    message = 'Requesting data of file # {}'.format(file_id)
    return render_template(
        'plot-housekeeping.html', file_id=file_id, message=message)


@app.route("/plot/housekeeping", methods=['GET', 'POST'])
def view_housekeeping():
    start_unix = 0
    span_sec = 0
    if request.method == 'GET':
        try:
            start_unix = float(request.args['start_unix'])
            span_sec = float(request.args['span_sec'])
        except:
            pass

    return render_housekeeping(start_unix, span_sec)


def render_housekeeping(start_unix=0, span_sec=0, message=""):
    return render_template(
        'plot-housekeeping.html',
        start_unix=start_unix,
        span_sec=span_sec,
        message=message)


@app.route("/request/headers/latest/<int:service_type>/<int:num>")
def request_latest_packets(service_type, num):
    result = STIX_MDB.select_last_packet_headers_by_service_type(
        service_type, num)
    return json_util.dumps(result)


@app.route("/request/headers/pid-tw", methods=['POST', 'GET'])
def request_packets():
    result = {'status': 'unknown', 'packets': []}
    if request.method == 'POST':
        try:
            #request from packet-request form directly
            start_utc = request.form['start_utc'] + 'Z'
            span_sec = int(request.form['span_min']) * 60
            selection_type = request.form['seltype']
            packets = []
            status = "Invalid request"
            start_unix = convert_to_unix_time(start_utc)

            if selection_type == 'SPID':
                val = request.form['SPID']
                if val:
                    SPID = int(val)
                    status, packets = STIX_MDB.select_packets_by_SPIDs(
                        SPID, start_unix, span_sec, header_only=True)
            elif selection_type == 'service':
                val = request.form['service_type']
                if val:
                    services = []
                    if int(val) == 0:
                        services = [1, 3, 5, 6, 17, 21, 22, 236, 237, 238, 239]
                    else:
                        services = [int(val)]

                    status, packets = STIX_MDB.select_packets_by_services(
                        services, start_unix, span_sec, header_only=True)
            elif selection_type == 'TC':
                status, packets = STIX_MDB.select_telecommand_packets(
                    start_unix, span_sec, header_only=True)

            result = {'status': status, 'packets': packets}
        except Exception as e:
            result = {'status': str(e), 'packets': []}
    return json_util.dumps(result)


@app.route("/request/headers/file/<int:file_id>")
def load_headers_of_file(file_id):
    status, packets = STIX_MDB.select_packets_by_run(file_id, header_only=True)
    result = {'status': status, 'packets': packets}
    return json_util.dumps(result)


@app.route("/request/packets/file/<int:file_id>/<group>")
def load_packets_of_file(file_id, group):
    SPIDs = get_group_spids(group)
    status, packets = STIX_MDB.select_packets_by_run(
        file_id, SPIDs=SPIDs, header_only=False)
    result = {'status': status, 'packets': packets}
    return json_util.dumps(result)


@app.route("/request/headers/calibration/<int:calibration_id>")
def load_headers_of_calibration(calibration_id):
    status, packets = STIX_MDB.select_packets_by_calibration(
        calibration_id, header_only=True)
    result = {'status': status, 'packets': packets}
    return json_util.dumps(result)


@app.route("/request/packet/id/<packet_id>")
def load_packet_of_id(packet_id):
    packet = STIX_MDB.select_packet_by_id(packet_id)
    return json_util.dumps(packet)


@app.route("/request/packets/spid-tw", methods=['GET'])
def request_packets_by_spid_tw():
    result = {'status': 'Invalid request', 'packets': []}
    try:
        start_unix = float(request.values['start'])
        span_seconds = float(request.values['span'])
        spids = [int(request.values['spid'])]
        if start_unix > 0 and span_seconds > 0 and spids:
            status, packets = STIX_MDB.select_packets_by_SPIDs(
                spids, start_unix, span_seconds, header_only=False)
            result = {'status': status, 'packets': packets}
    except Exception as e:
        result = {'status': str(e), 'packets': []}
    return json_util.dumps(result)


@app.route("/request/packets/type-tw/<packet_type>", methods=['POST', 'GET'])
def request_packets_by_type_tw(packet_type):
    result = {'status': 'Invalid request', 'packets': []}
    SPIDs = get_group_spids(packet_type)
    if SPIDs:
        try:
            #request from plot-housekeeping, requested sent by Ajax
            start_unix = float(request.values['start_unix'])
            span_seconds = float(request.values['span_seconds'])
            if start_unix > 0 and span_seconds > 0:
                status, packets = STIX_MDB.select_packets_by_SPIDs(
                    SPIDs, start_unix, span_seconds, header_only=False)
                result = {'status': status, 'packets': packets}
        except Exception as e:
            result = {'status': str(e), 'packets': []}
        return json_util.dumps(result)


"""
@app.route("/request/last-packets/type-tw")
def request_last_telemetry_packets(packet_type):
    result = {'status': 'Invalid request', 'packets': []}
    SPIDs = get_group_spids(packet_type)
    if SPIDs:
        try:
            start_unix = float(request.values['start_unix'])
            span_seconds = float(request.values['span_seconds'])
            if start_unix > 0 and span_seconds > 0:
                status, packets = STIX_MDB.select_last_packets(SPIDs, start_unix, span_seconds)
                result = {'status': status, 'packets': packets}
        except Exception as e:
            result = {'status': str(e), 'packets': []}
    return json_util.dumps(result)
"""


@app.route("/request/pdf/quicklook/<int:run_id>")
def request_quicklook_pdf(run_id):
    abs_filename = STIX_MDB.get_run_ql_pdf(run_id)
    print(abs_filename)
    if abs_filename:
        path_name = os.path.dirname(abs_filename)
        filename = os.path.basename(abs_filename)
        return send_from_directory(
            directory=path_name, filename=filename, mimetype='application/pdf')

    else:
        page_not_found(404)


@app.route("/request/calibration/info", defaults={'calibration_id': -1})
@app.route("/request/calibration/info/<int:calibration_id>")
def view_calibration_info(calibration_id):
    data = STIX_MDB.get_calibration_run_info(calibration_id)
    return json_util.dumps(data)


@app.route('/request/calibration/runs/tw/', methods=['GET', 'POST'])
def request_calibration_runs():
    result = {'status': 'Invalid request', 'data': []}
    try:
        start_unix = float(request.values['start_unix'])
        span_seconds = float(request.values['span_seconds'])
    except (TypeError, ValueError, IndexError):
        return json_util.dump(result)
    if start_unix > 0 and span_seconds > 0:
        status, data = STIX_MDB.select_calibration_runs_by_tw(
            start_unix, span_seconds)
        result['status'] = status
        result['data'] = data
    return json_util.dumps(result)


@app.route('/request/qllc/tw', methods=['POST','GET'])
def request_quicklook_lightcurves():
    result = {'status': 'Invalid request', 'data': []}
    try:
        start_unix = float(request.values['start_unix'])
        span_seconds = float(request.values['span_seconds'])
        if start_unix > 0 and span_seconds > 0:
            data = STIX_MDB.get_lightcurve_packets(start_unix, span_seconds)
        if start_unix == 0 and span_seconds == 0:
            data = STIX_MDB.get_last_lightcurve_packets()
        result['status'] = 'OK'
        result['data'] = data

    except (TypeError, ValueError, IndexError):
        result = {'status': 'Invalid request', 'data': []}

    return json_util.dumps(result)


@app.route("/request/last-packet/timestamp/<int:SPID>")
def request_last_telemetry_packet_timestamp(SPID):
    unix_time= STIX_MDB.get_last_packet_unix_time(SPID)
    result={'unix_time':unix_time}
    return json_util.dumps(result)

