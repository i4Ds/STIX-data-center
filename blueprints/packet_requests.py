from flask import Flask, Blueprint, render_template, request, send_from_directory, Response, url_for, send_file
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api
from core import utils

packet_requests = Blueprint('packet_requests',
                            __name__,
                            template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()


def get_group_spids(packet_type):
    if packet_type not in ['hk', 'qllc', 'qlbkg', 'qlspec', 'scil0', 'cal']:
        return []
    if packet_type == 'hk':
        spids = [54102, 54101]
    elif packet_type == "cal":
        spids = [
            54124,
        ]
    elif packet_type == "qllc":
        spids = [
            54118,
        ]
    elif packet_type == "qlbkg":
        spids = [
            54119,
        ]
    elif packet_type == "qlspec":
        spids = [
            54120,
        ]
    elif packet_type == "scil0":
        spids = [
            54114,
        ]
    return spids


@packet_requests.route("/request/last-packet/timestamp/<int:SPID>")
def request_last_telemetry_packet_timestamp(SPID):
    unix_time = STIX_MDB.get_last_packet_unix_time(SPID)
    result = {'unix_time': unix_time}
    return json_util.dumps(result)


# decoded packet requests


def format_packet_headers(packets):
    data = []
    for pkt in packets:
        header = pkt['header']
        pid = ''
        if header['TMTC'] == 'TM':
            pid = header['SPID']
        else:
            pid = header['name']

        data.append([
            pkt['_id'], header['TMTC'], header['service_type'],
            header['service_subtype'], header['unix_time'], pid
        ])
    return data


@packet_requests.route("/view/packet/id/<int:packet_id>")
def view_packet_of_id(packet_id):
    return render_template('packet-request.html', packet_id=packet_id)


@packet_requests.route("/view/packet/request")
def view_request_form():
    return render_template('packet-request.html', packet_id=-1)


def view_packet_of_file(file_id):
    return render_template('packet-request.html', file_id=file_id)


@packet_requests.route('/view/packet/calibration/<int:calibration_id>')
def view_calibration_packets(calibration_id):
    return render_template('packet-request.html',
                           calibration_id=calibration_id)


@packet_requests.route("/view/packet/file/<file_id>")
def view_packets_of_file(file_id):
    return view_packet_of_file(file_id)


@packet_requests.route("/request/headers/latest/<int:service_type>/<int:num>")
def request_latest_packets(service_type, num):
    status, packets = STIX_MDB.select_last_packet_headers_by_service_type(
        service_type, num)
    data = format_packet_headers(packets)
    result = {'status': status, 'data': data}
    return json_util.dumps(result)


@packet_requests.route("/request/headers/pid-tw", methods=['POST', 'GET'])
def request_packets():
    result = {'status': 'unknown', 'data': []}
    if request.method == 'POST':
        try:
            #request from packet-request form directly
            start_utc = request.form['start_utc'] + 'Z'
            span_sec = int(request.form['span_min']) * 60
            selection_type = request.form['seltype']
            packets = []
            status = "Invalid request"
            start_unix = utils.to_unix_time(start_utc)

            if selection_type == 'SPID':
                val = request.form['SPID']
                if val:
                    spid = int(val)
                    status, packets = STIX_MDB.select_packets_by_SPIDs(
                        spid, start_unix, span_sec, header_only=True)
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

            data = format_packet_headers(packets)
            result = {'status': status, 'data': data}
        except Exception as e:
            result = {'status': str(e), 'data': []}
    return json_util.dumps(result)


@packet_requests.route("/request/headers/file/<int:file_id>")
def load_packet_headers_of_file(file_id):
    status, packets = STIX_MDB.select_packets_by_run(file_id, header_only=True)
    data = format_packet_headers(packets)
    info=STIX_MDB.get_raw_file_info(file_id)
    idb_version='unknown'
    filename=''
    filesize=0
    try:
        idb_version=info['idb_version']
        filename=info['filename']
        filesize=info['summary']['total_length']
    except KeyError:
        pass
    result = {'status': status, 'data': data, 'filename':filename, 'idb':idb_version, 'filesize':filesize}
    return json_util.dumps(result)


@packet_requests.route("/request/packets/file/<int(signed=True):file_id>/<group>")
def load_packets_of_file(file_id, group):
    spids = get_group_spids(group)
    status, packets = STIX_MDB.select_packets_by_run(file_id,
                                                     SPIDs=spids,
                                                     header_only=False)

    result = {'status': status, 'packets': packets}
    return json_util.dumps(result)


@packet_requests.route("/request/headers/calibration/<int:calibration_id>")
def load_headers_of_calibration(calibration_id):
    status, packets = STIX_MDB.select_packets_by_calibration(calibration_id,
                                                             header_only=True)
    data = format_packet_headers(packets)
    result = {'status': status, 'data': data}
    return json_util.dumps(result)


@packet_requests.route("/request/packet/id/<packet_id>")
def load_packet_of_id(packet_id):
    packet = STIX_MDB.select_packet_by_id(packet_id)
    return json_util.dumps(packet)


@packet_requests.route("/request/packets/ids", methods=['POST'])
def load_packets():
    packets = []
    try:
        ids_str = request.values['ids']
        ids = [int(x) for x in ids_str.split(',')]
        if ids:
            packets = STIX_MDB.select_packets_by_ids(ids)
    except Exception as e:
        pass
    return json_util.dumps(packets)


@packet_requests.route("/request/packets/spid-tw", methods=['GET'])
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


@packet_requests.route("/request/packets/type-tw/<packet_type>",
                       methods=['POST', 'GET'])
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
