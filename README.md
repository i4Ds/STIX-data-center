# STIX raw data web viewer 

## Enviroment setup


```

sudo apt-get install python3
pip3 install flask werkzeug 
```
Install mongodb, see:

 https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
 
 
##  Data import

Raw data packets are stored in the MongoDB. 
```
python application/parser -i test.dat  --wdb
```

## MongoDB opitmiization

Open mongodb shell then run 
```
 db.getCollection('<collection_name>').CreateIndex({<index>: 1})
```
 The following indexes must be created for packets:
```
header.UTC
header.SPID
header.service_type
header.service_subtype
header.unix_time
header.TMTC
run_id

```
For more see https://docs.mongodb.com/manual/core/query-optimization/

 
## Run the server for testing purporses

```
 python wsgi.py
 
```

## Deployment

ngnix and gunicore are recommanded for the final server. 
### Installation
```
sudo apt-get install nginx
pip3 install gunicore
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



## Security

Change the mongodb port 
mongodb ip local only




It will reduce database query time significantly (e.g. from 10 seconds to 5 ms)

## TODOs
 
 - change the folder structure
 - use flask Blueprint
