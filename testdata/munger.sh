#!/bin/bash

for VAR in $(ls *.testplan)
do
    BASE=$(basename $VAR .testplan)
    echo "${BASE}".yarn
    # ./ysc compile "${BASE}".yarn
    # mv Output.yarnc finished/"${BASE}".yarnc
    # mv Output.csv finished/"${BASE}".csv
done
