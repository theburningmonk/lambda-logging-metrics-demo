'use strict';

const _          = require('lodash');
const co         = require('co');
const Promise    = require('bluebird');
const parse      = require('../../lib/parse');
const cloudwatch = require('../../lib/cloudwatch');
const namespace  = "theburningmonk.com";

let processAll = co.wrap(function* (logGroup, logStream, logEvents) {
  let funcName    = parse.functionName(logGroup);
  let lambdaVer   = parse.lambdaVersion(logStream);
  let metricDatum = 
    _.flatMap(logEvents, e => parse.usageMetrics(funcName, lambdaVer, e.message));

  yield cloudwatch.publish(metricDatum, namespace);
});

module.exports = processAll;