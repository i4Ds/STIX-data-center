service mongod restart
gunicorn --bind 127.0.0.1:8001 wsgi:app --daemon

