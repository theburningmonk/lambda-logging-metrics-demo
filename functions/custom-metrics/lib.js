'use strict';

const _          = require('lodash');
const co         = require('co');
const Promise    = require('bluebird');
const parse      = require('../../lib/parse');
const cloudwatch = require('../../lib/cloudwatch');

let processAll = co.wrap(function* (logGroup, logStream, logEvents) {
  let funcName    = parse.functionName(logGroup);
  let lambdaVer   = parse.lambdaVersion(logStream);
  let metricDatum = 
    logEvents
      .map(e => parse.customMetric(funcName, lambdaVer, e.message))
      .filter(m => m != null && m != undefined);

  let metricDatumByNamespace = _.groupBy(metricDatum, m => m.Namespace);
  let namespaces = _.keys(metricDatumByNamespace);
  for (let namespace of namespaces) {
    let datum = metricDatumByNamespace[namespace];
    yield cloudwatch.publish(datum, namespace);
  }
});

module.exports = processAll;