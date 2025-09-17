#!/bin/bash

sftp greg@research-stage.artsci.wustl.edu:/home/greg/TRIADS/courses/courses-ui/public <<EOF

put -r build/*

exit
EOF

