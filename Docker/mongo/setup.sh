#!/bin/bash
mongo <<EOF
use admin;
db.auth('root', '123456');
use stix;
db.createUser({user:'test',pwd:'test',roles:[{role:'readWrite',db:'stix'}]});
db.createCollection("user");
EOF