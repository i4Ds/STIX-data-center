from flask import Blueprint, render_template, abort
from bson import json_util
from jinja2 import TemplateNotFound
from core import mongodb_api
from core import utils

detector_tests = Blueprint('detector_tests',
                           __name__,
                           template_folder='templates')

STIX_MDB = mongodb_api.MongoDB()


#detector tests
@detector_tests.route("/plot/detector/tests", defaults={'test_id': -1})
@detector_tests.route("/plot/detector/tests/<int:test_id>")
def view_detector_tests(test_id):
    message = 'Requesting data of detector test run # {}'.format(test_id)
    if test_id == -1:
        message = 'Requesting data of last detector test run info'
    return render_template('plot-detector-tests.html',
                           test_id=test_id,
                           message=message)


@detector_tests.route('/request/detector/tests/tw/', methods=['GET', 'POST'])
def request_detector_tests():
    result = {'status': 'Invalid request', 'data': []}
    try:
        start_unix = float(request.values['start_unix'])
        span_seconds = float(request.values['span_seconds'])
    except (TypeError, ValueError, IndexError):
        return json_util.dumps(result)
    if start_unix > 0 and span_seconds > 0:
        status, data = STIX_MDB.select_detector_tests_by_tw(
            start_unix, span_seconds)
        result['status'] = status
        result['data'] = data
    return json_util.dumps(result)


@detector_tests.route('/request/detector/test/<packet_id>/<which>')
def request_detector_test_packet(packet_id, which):
    packets = STIX_MDB.get_detector_test_report(packet_id, which)
    return json_util.dumps(packets)
