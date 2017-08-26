'use strict';

// logGroup looks like this:
//    "logGroup": "/aws/lambda/service-env-funcName"
let functionName = function (logGroup) {
  return logGroup.split('/').reverse()[0];
};

// logStream looks like this:
//    "logStream": "2016/08/17/[76]afe5c000d5344c33b5d88be7a4c55816"
let lambdaVersion = function (logStream) {
  let start = logStream.indexOf('[');
  let end = logStream.indexOf(']');
  return logStream.substring(start+1, end);
};

let isDate = function (str) {
  return !isNaN(Date.parse(str));
}

// this won't work for some units like Bits/Second, Count/Second, etc.
// but hey, this is a demo ;-)
let toCamelCase = function(str) {
  return str.substr( 0, 1 ).toUpperCase() + str.substr( 1 );
}

// a typical log message looks like this:
//    "2017-04-26T10:41:09.023Z\tdb95c6da-2a6c-11e7-9550-c91b65931beb\tmy log message\n"
// the metrics message we're looking for looks like this:
//    "2017-04-26T10:41:09.023Z\tdb95c6da-2a6c-11e7-9550-c91b65931beb\tMONITORING|metric_value|metric_unit|metric_name|namespace\n"
let metric = function (functionName, version, message) {
  let parts = message.split('\t', 3);

  if (parts.length === 3 && isDate(parts[0]) && parts[2].startsWith("MONITORING")) {
    let timestamp  = parts[0];
    let requestId  = parts[1];
    let logMessage = parts[2];

    let metricData = logMessage.split('|');
    return {
      Value      : parseFloat(metricData[1]),
      Unit       : toCamelCase(metricData[2].trim()),
      MetricName : metricData[3].trim(),
      Dimensions : [
        { Name: "FunctionName", Value: functionName },
        { Name: "FunctionVersion", Value: version }
      ],
      Timestamp  : new Date(timestamp),
      Namespace  : metricData[4].trim()
    };
  }

  return null;
};

module.exports = {
  functionName,
  lambdaVersion,
  metric
};