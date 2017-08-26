'use strict';

const namespace = "theburningmonk.com";

function sendMetric(name, value, unit) {
  console.log(`MONITORING|${value}|${unit}|${name}|${namespace}`);
}

module.exports.handler = (event, context, callback) => {
  let pageViews = Math.ceil(Math.random() * 42);
  sendMetric("page_view", pageViews, "count");

  let latency = Math.random() * 42;
  sendMetric("latency", latency, "milliseconds");
 	
  let response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "dracarys"
    })
  };
  callback(null, response);
};