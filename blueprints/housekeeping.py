from flask import Flask, Blueprint, render_template, request, send_from_directory, Response, url_for, send_file
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api

housekeeping = Blueprint('housekeeping', __name__, template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()

#housekeeping data viewer

@housekeeping.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@housekeeping.route("/plot/housekeeping/file", methods=['GET'])
def view_housekeeping_file_url():
    file_id=-1
    message=""
    if request.method == 'GET':
        try:
            file_id= int(request.args['file_id'])
            message = 'Requesting data of file # {}'.format(file_id)
        except:
            message='Invalid request'

    return render_template('plot-housekeeping.html', 
                           file_id=file_id,
                           message=message)


@housekeeping.route("/plot/housekeeping/file/<int:file_id>")
def view_file_housekeeping(file_id):
    message = 'Requesting data of file # {}'.format(file_id)
    return render_template('plot-housekeeping.html',
                           file_id=file_id,
                           message=message)


@housekeeping.route("/plot/housekeeping", methods=['GET', 'POST'])
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
    return render_template('plot-housekeeping.html',
                           start_unix=start_unix,
                           span_sec=span_sec,
                           message=message)
