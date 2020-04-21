import os
from flask import Flask, Blueprint, render_template, request, send_from_directory, Response, url_for, send_file
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api


calibration = Blueprint('calibration', __name__, template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()


@calibration.route("/plot/calibration/",
                   defaults={
                       'calibration_id': -1,
                       'file_id': -1
                   })
@calibration.route("/plot/calibration/<int:calibration_id>",
                   defaults={'file_id': -1})
@calibration.route("/plot/calibration/file/<int:file_id>",
                   defaults={'calibration_id': -1})
def view_calibration(calibration_id, file_id):
    message = ''
    return render_template('plot-calibration.html',
                           calibration_id=calibration_id,
                           file_id=file_id,
                           message=message)


@calibration.route("/request/calibration/info",
                   defaults={'calibration_id': -1})
@calibration.route("/request/calibration/info/<int:calibration_id>")
def request_calibration_info(calibration_id):
    data = STIX_MDB.get_calibration_run_info(calibration_id)
    run=None
    if data:
        run=list(data)[0]
    if 'analysis_report' in run:
        run['analysis_report']=1
    else:
        run['analysis_report']=0
    return json_util.dumps([run])

@calibration.route("/request/calibration/spectra/<int:calibration_id>")
def request_calibration_spectra(calibration_id):
    data = STIX_MDB.get_calibration_spectra(calibration_id)
    return json_util.dumps(data)

@calibration.route('/plot/calibration/file', methods=['GET'])
def request_calibration_by_file():
    run=-1
    message = ''
    file_id=-1
    try:
        file_id= int(request.values['file_id'])
        message='Request calibration runs in File #{}'.format(file_id)
    except:
        message='Invalid request'
    return render_template('plot-calibration.html',
                           calibration_id=run,
                           file_id=file_id,
                           message=message)

@calibration.route('/plot/calibration/run', methods=['GET'])
def request_calibration_by_run():
    run=-1
    message = ''
    file_id=-1
    try:
        run= int(request.values['run'])
        message='Request calibration run {}'.format(run)
    except:
        message='Invalid request'
    return render_template('plot-calibration.html',
                           calibration_id=run,
                           file_id=file_id,
                           message=message)
@calibration.route('/request/calibration/runs/tw/', methods=['GET', 'POST'])
def request_calibration_run_data():
    result = {'status': 'Invalid request', 'data': []}
    try:
        start_unix = float(request.values['start_unix'])
        span_seconds = float(request.values['span_seconds'])
    except (TypeError, ValueError, IndexError):
        return json_util.dumps(result)
    if start_unix > 0 and span_seconds > 0:
        status, data = STIX_MDB.select_calibration_runs_by_tw(
            start_unix, span_seconds)
        result['status'] = status
        result['data'] = data
    return json_util.dumps(result)


@calibration.route("/request/calibration/runs/file/<int:fid>")
def request_calibration_run_ids(fid):
    """
    Get calibration run numbers of the given file 
    if -1 get the last file
    """
    result = []
    try:
        result = STIX_MDB.get_calibration_run_ids_by_fid(int(fid))
    except (TypeError, ValueError):
        pass
    return json_util.dumps(result)


@calibration.route("/request/calibration/num/fid/<fid>")
def request_numb_calibration_runs(fid):
    result = [0]
    try:
        result = [STIX_MDB.select_calibration_runs_by_fid(int(fid))]
    except ValueError:
        pass
    return json_util.dumps(result)

@calibration.route("/request/calibration/pdf/<calibration_id>")
def open_calibration_analysis_pdf_ready(calibration_id):
    pdf_filename= STIX_MDB.get_calibration_pdf(calibration_id)
    path=os.path.dirname(pdf_filename)
    filename=os.path.basename(pdf_filename)
    if pdf_filename:
        return send_from_directory(path, filename, mimetype='application/pdf')
    else:
        return render_template('404.html'), 404



@calibration.route("/request/calibration/elut/<calibration_id>")
def open_calibration_analysis_elut(calibration_id):
    data = STIX_MDB.get_calibration_elut(calibration_id)
    return json_util.dumps(data)
