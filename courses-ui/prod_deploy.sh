#!/bin/bash

sftp greg@research-prod.artsci.wustl.edu:/home/greg/TRIADS/courses/courses-ui/public <<EOF

put -r ./build/*

exit
EOF

