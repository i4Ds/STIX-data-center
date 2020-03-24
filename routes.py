#!/usr/bin/env python3
# -*- encoding: utf-8 -*-
#  Author: Hualin Xiao (hualin.xiao@fhnw.ch)
#TODO:
#  - add paginations for telemetry file  list view
# -- using flask blueprint

import os

from flask import Flask, render_template, request, send_from_directory, Response, url_for,send_file
from core import mongodb_api
from core import stix_bundle
#from core import desc

app = Flask(__name__)
app.config['mongo_server'] = 'localhost'
app.config['mongo_port'] = 27017
app.config['mongo_user'] = ''
app.config['mongo_pwd'] = ''
app.config['PDOR_folder']='/opt/stix/PDORs'

STIX_MDB = mongodb_api.MongoDB(app)

bundles=stix_bundle.set_bundles(app)
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'images/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.template_filter('to_hex')
def _jinja2_filter_to_hex(value, fmt=None):
    try:
        return hex(value)
    except TypeError:
        return value


@app.template_filter('strftime')
def _jinja2_filter_datetime(unix_time, fmt=None):
    return datetime.utcfromtimestamp(unix_time).strftime('%Y-%m-%dT%H:%M:%SZ')




from blueprints.packet_requests import packet_requests
app.register_blueprint(packet_requests)

from blueprints.calibration import calibration
app.register_blueprint(calibration)


from blueprints.ior_manager import ior_manager
app.register_blueprint(ior_manager)


from blueprints.detector_tests import detector_tests
app.register_blueprint(detector_tests)

from blueprints.housekeeping import housekeeping
app.register_blueprint(housekeeping)

from blueprints.quicklook import quicklook
app.register_blueprint(quicklook)

from blueprints.raw_manager import raw_manager 
app.register_blueprint(raw_manager)
from blueprints.uploader import uploader
app.register_blueprint(uploader)
