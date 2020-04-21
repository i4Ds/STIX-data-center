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
    result = STIX_MDB.get_raw_files(start, num)
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
            result = STIX_MDB.select_raw_files_by_tw(
                start_unix, end_unix)
        except (TypeError, ValueError, IndexError):
            pass
    return json_util.dumps(result)


@raw_manager.route("/download/rawfile/<int:fid>")
def download_rawfile(fid):
    file_infos= STIX_MDB.get_raw_file_info(fid)
    if not file_infos:
        return page_not_found(404)
    path = file_infos['path']
    filename = file_infos['filename']
    try:
        return send_from_directory(path, filename, as_attachment=True)
    except Exception as e:
        #print(e)
        return page_not_found(404)




@raw_manager.route("/request/file/info/filename", methods=['POST'])
def request_list_of_files_by_filename():
    result = []
    if request.method == 'POST':
        try:
            filename= request.form['filename']
            result = STIX_MDB.select_raw_files_by_filename(filename)
        except (TypeError, ValueError, IndexError):
            pass
    return json_util.dumps(result)


@raw_manager.route("/request/file/maxid")
def request_file_maxid():
    max_id=-1
    max_id= STIX_MDB.get_last_file_id()
    return json_util.dumps([max_id])


