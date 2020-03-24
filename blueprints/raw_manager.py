from flask import Flask, Blueprint, render_template, send_from_directory, Response, url_for, send_file, abort
from flask import request
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api
from core import utils

raw_manager = Blueprint('raw_manager', __name__, template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()

# raw data file list


@raw_manager.route("/")
@raw_manager.route("/view/list/files")
def view_filelist():
    return render_template('list-files.html')


@raw_manager.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@raw_manager.route("/request/file/info/<int(signed=True):start>/<int:num>")
def request_file_info(start, num):
    """
     return the last N entries if start <0
    """
    result = STIX_MDB.get_processing_runs(start, num)
    return json_util.dumps(result)


@raw_manager.route("/request/file/info/tw", methods=['POST'])
def request_list_of_files_by_tw():
    result = []
    if request.method == 'POST':
        try:
            start = request.form['start']
            end = request.form['end']
            start_unix = utils.to_unix_time(start)
            end_unix = utils.to_unix_time(end)
            result = STIX_MDB.select_processing_runs_by_tw(
                start_unix, end_unix)
        except (TypeError, ValueError, IndexError):
            pass

    return json_util.dumps(result)


@raw_manager.route("/download/rawfile/<int:fid>")
def download_rawfile(fid):
    processing_runs = STIX_MDB.get_run_info(fid)
    if not processing_runs:
        return page_not_found(404)
    path = processing_runs['path']
    filename = processing_runs['filename']
    print(path, filename)
    try:
        return send_from_directory(path, filename, as_attachment=True)
    except Exception as e:
        print(e)
        return page_not_found(404)
