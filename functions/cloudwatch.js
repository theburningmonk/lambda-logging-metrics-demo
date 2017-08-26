'use strict';

const co         = require('co');
const Promise    = require('bluebird');
const AWS        = require('aws-sdk');
const cloudWatch = Promise.promisifyAll(new AWS.CloudWatch());

let publish = co.wrap(function* (metricDatum, namespace) {
  let metricData = metricDatum.map(m => {
    return {
      MetricName : m.MetricName,
      Dimensions : m.Dimensions,
      Timestamp  : m.Timestamp,
      Unit       : m.Unit,
      Value      : m.Value
    };
  });

  let req = {
    MetricData: metricData,
    Namespace: namespace
  };

  yield cloudWatch.putMetricDataAsync(req);
});

module.exports = {
  publish
};