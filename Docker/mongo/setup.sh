#!/bin/bash
mongo <<EOF
use admin;
db.auth('root', '123456');
use stixq;
db.createUser({user:'test',pwd:'test',roles:[{role:'readWrite',db:'stix'}]});
db.createCollection("user");
EOF