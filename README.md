# STIX  data web browsers 

based on MongoDB, Python-Flask, bootstrap4  and JQuery.



## Enviroment setup


```

sudo apt-get install python3
pip3 install flask werkzeug flask-assets  jsmin cssmin
```
To install mongodb, please follow the manual at 

 https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
 
 
##  Test data import

Raw data packets are stored in the MongoDB. 

```
./application/parser.py   -i test.dat  --wdb
```


 
## Start the web server for testing purporses

```
 python wsgi.py
```


## MongoDB performance optimization


Some third-party GUIs are recommended in order to to interact with MongoDB,  for example, Robo3T which is available at:
https://robomongo.org/

Indexes support the efficient execution of queries in MongoDB. Without indexes, MongoDB must perform a collection scan, i.e. scan every document in a collection, to select those documents that match the query statement.

Open mongodb shell then run
```
 db.getCollection('packets').CreateIndex({<index>: 1})
```
Replacing <index> with the following items
```
header.UTC
header.SPID
header.service_type
header.service_subtype
header.unix_time
header.TMTC
run_id
```

 

For more optimizations, see https://docs.mongodb.com/manual/core/query-optimization/



## Deployment


ngnix and gunicore are recommended for the final server as described at 
https://flask.palletsprojects.com/en/1.1.x/deploying/

### Installation
```
sudo apt-get install nginx
pip3 install gunicorn
```

### Configure ngnix
gedit /etc/nginx/nginx.conf

```

user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
	worker_connections 768;
	# multi_accept on;
}

http {


	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	# server_tokens off;

	# server_names_hash_bucket_size 64;
	# server_name_in_redirect off;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	##
	# SSL Settings
	##

	ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;

	##
	# Logging Settings
	##

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	##
	# Gzip Settings
	##

	gzip on;

	 gzip_vary on;
	 gzip_proxied any;
	 gzip_comp_level 6;
	 gzip_buffers 16 8k;
	 gzip_http_version 1.1;
	 gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

	##
	# Virtual Host Configs
	##

	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;
	server {
	    listen 80;
	   # server_name ; 
			location /static  {
			    root wwww/;
			    expires 30d;
			}


		    location / {
			proxy_pass http://127.0.0.1:8001; 
			proxy_set_header Host $host;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		    }
	 }

}
```
### Start gunicorn

```
gunicorn --bind 127.0.0.1:8001 wsgi:app --daemon
```



## Security issues



## TODOs
 
 - change the folder structure
 - use flask Blueprint
