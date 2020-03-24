from flask import Flask, Blueprint, render_template, send_from_directory, Response, url_for, send_file, abort
from flask import request
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api
from core import utils

uploader= Blueprint('uploader', __name__, template_folder='templates')
STIX_MDB = mongodb_api.MongoDB()

# raw data file list


@uploader.route("/upload/raw")
def upload():
    return render_template('upload.html')


@uploader.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


