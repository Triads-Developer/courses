#!/bin/bash

sftp greg@research-dev.artsci.wustl.edu:/home/greg/TRIADS/courses/courses-server/ <<EOF

put -r data/
put -r ecosystem.config.js
put -r index.js
put -r package.json
put -r package-lock.json
put -r search.js
put -r config/
put -r routes/
put -r utils/

exit
EOF
