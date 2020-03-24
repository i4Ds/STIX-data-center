from flask import Flask, Blueprint, render_template, request, send_from_directory, Response, url_for, send_file
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api
from core import utils
from core import css

ior_manager = Blueprint('ior_manager', __name__, template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()


#operation requests
@ior_manager.route("/view/list/operation-requests")
def view_list_of_operation_request():
    return render_template('list-iors.html')

@ior_manager.route("/view/ior/", defaults={'fid':-1})
@ior_manager.route("/view/ior/<int:fid>")
def view_operation_request(fid):
    return render_template('view-ior.html', file_id=fid)


@ior_manager.route("/view/ior/overview/<int:fid>")
def view_operation_request_overview(fid):
    return render_template('ior-overview.html', file_id=fid)

@ior_manager.route("/view/ior/latex/<int:fid>")
def operation_request_to_latex(fid):
    return render_template('ior-overview-latex.html', file_id=fid)




@ior_manager.route("/request/ior/<int:fid>")
def request_operation_request(fid):
    result = []
    try:
        result = STIX_MDB.select_operation_request_by_id(int(fid))
    except ValueError:
        pass
    return json_util.dumps(result)

@ior_manager.route("/request/ior/info/last")
def request_last_operation_request_info():
    result = []
    try:
        result = STIX_MDB.select_last_operation_request_info()
    except ValueError:
        pass
    return json_util.dumps(result)


@ior_manager.route("/request/ior/info/tw", methods=['POST'])
def request_list_of_ior_by_tw():
    result = []
    if request.method == 'POST':
        try:
            start = request.form['start']
            end = request.form['end']
            time_type = request.form['timeType']
            print(request)
            start_unix = utils.to_unix_time(start)
            end_unix = utils.to_unix_time(end)
            use_gen_time = True
            if int(time_type) == 2:
                use_gen_time = False
            result = STIX_MDB.select_operation_request_by_tw(
                start_unix, end_unix, use_gen_time)
        except (TypeError, ValueError, IndexError):
            pass

    return json_util.dumps(result)

@ior_manager.route("/request/ior/css/<seq_name>")
def extend_sequence(seq_name):
    result = []
    if seq_name in css.MIB_CSS:
        result=css.MIB_CSS[seq_name]
    return json_util.dumps(result)


