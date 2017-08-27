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
let customMetric = function (functionName, version, message) {
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

let parseFloatWith = (regex, input) => {
  let res = regex.exec(input);
  return parseFloat(res[1]);
}

let mkMetric = (value, unit, name, dimensions) => {
  return {
    Value      : value,
    Unit       : toCamelCase(unit),
    MetricName : name,
    Dimensions : dimensions,
    Timestamp  : new Date()
  };
}

// a typical report message looks like this:
//    "REPORT RequestId: 3897a7c2-8ac6-11e7-8e57-bb793172ae75\tDuration: 2.89 ms\tBilled Duration: 100 ms \tMemory Size: 1024 MB\tMax Memory Used: 20 MB\t\n"
let usageMetrics = function (functionName, version, message) {  
  if (message.startsWith("REPORT RequestId:")) {
    let parts = message.split("\t", 5);

    let billedDuration = parseFloatWith(/Billed Duration: (.*) ms/i, parts[2]);
    let memorySize     = parseFloatWith(/Memory Size: (.*) MB/i, parts[3]);
    let memoryUsed     = parseFloatWith(/Max Memory Used: (.*) MB/i, parts[4]);
    let dimensions     = [
      { Name: "FunctionName", Value: functionName },
      { Name: "FunctionVersion", Value: version }
    ];

    return [
      mkMetric(billedDuration, "milliseconds", "BilledDuration", dimensions),
      mkMetric(memorySize, "megabytes", "MemorySize", dimensions),
      mkMetric(memoryUsed, "megabytes", "MemoryUsed", dimensions),
    ];
  }

  return [];
}

module.exports = {
  functionName,
  lambdaVersion,
  customMetric,
  usageMetrics
};