
from datetime import datetime
from dateutil import parser as dtparser
def to_unix_time(timestamp):
    dt = None
    if isinstance(timestamp, float):
        return timestamp
    elif isinstance(timestamp, str):
        try:
            ts = float(timestamp)
            return ts
        except ValueError:
            dt = dtparser.parse(timestamp)
    elif isinstance(timestamp, datetime.datetime):
        dt = timestamp
    if dt:
        return dt.timestamp()
    return 0

