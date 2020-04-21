from flask import Flask, Blueprint, render_template, request, send_from_directory, Response, url_for, send_file, abort
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api

quicklook = Blueprint('quicklook', __name__, template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()


#  quicklook light curve viewer
@quicklook.route("/plot/lightcurves", methods=['GET'])
def view_lightcurves():
    start_unix = 0
    span_seconds = 0
    run = -1
    try:
        start_unix = float(request.values['start'])
        span_seconds = float(request.values['span'])
    except (KeyError, ValueError):
        pass
    try:
        run = int(request.values['run'])
    except (KeyError, ValueError):
        pass
    return render_template('plot-lightcurves.html',
                           start_unix=start_unix,
                           span_seconds=span_seconds,
                           run=run)


#quick-look specific spectra

@quicklook.route("/plot/qlspectra", methods=['GET'])
def view_qlspec_file():
    file_id = -1
    packet_id=-1
    message = ''
    try:
        file_id= int(request.values['file_id'])
        message = 'Requesting quicklook spectra of file: {}'.format(file_id)
    except:
        pass
    return render_template('plot-qlspectra.html',
                           packet_id=packet_id,
                           file_id=file_id,
                           message=message)



@quicklook.route("/plot/qlspectra/", defaults={'file_id': -1, 'packet_id': -1})
@quicklook.route("/plot/qlspectra/packet/<int:packet_id>",
                 defaults={'file_id': -1})
@quicklook.route("/plot/qlspectra/file/<int:file_id>",
                 defaults={'packet_id': -1})
def view_qlspectra(file_id, packet_id):
    if file_id >= 0:
        message = 'Requesting quicklook spectra of file: {}'.format(file_id)
    elif packet_id >= 0:
        message = 'Requesting packet # {}'.format(packet_id)
    else:
        message = ''
    return render_template('plot-qlspectra.html',
                           packet_id=packet_id,
                           file_id=file_id,
                           message=message)


# background monitor


@quicklook.route("/plot/background", methods=['GET'])
def view_background():
    start_unix = 0
    span_seconds = 0
    run = -1
    try:
        start_unix = float(request.values['start'])
        span_seconds = float(request.values['span'])
    except:
        pass
    try:
        run = float(request.values['run'])
    except:
        pass

    return render_template('plot-background.html',
                           start_unix=start_unix,
                           span_seconds=span_seconds,
                           run=run)


@quicklook.route('/request/ql/<packet_type>/tw', methods=['POST', 'GET'])
def request_quicklook(packet_type):
    result = {'status': 'Invalid request', 'data': []}
    data = []
    try:
        start_unix = float(request.values['start_unix'])
        span_seconds = float(request.values['span_seconds'])
        if start_unix > 0 and span_seconds > 0:
            data = STIX_MDB.get_quicklook_packets(packet_type, start_unix,
                                                  span_seconds)

        result['status'] = 'OK'
        result['data'] = data

    except (TypeError, ValueError, IndexError):
        result = {'status': 'Invalid request', 'data': []}
    return json_util.dumps(result)


@quicklook.route('/request/ql/<packet_type>/run/<int:run>')
def request_quicklook_of_run(packet_type, run):
    result = {'status': 'Invalid request', 'data': []}
    data = []
    try:
        data = STIX_MDB.get_quicklook_packets_of_run(packet_type, run)
        result['status'] = 'OK'
        result['data'] = data
    except (TypeError, ValueError, IndexError):
        result = {'status': 'Invalid request', 'data': []}
    return json_util.dumps(result)
