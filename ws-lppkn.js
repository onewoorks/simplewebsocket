
"use strict";

process.title = 'lppkn-websocket';

var webSocketsServerPort = 1337;

var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];
var server = http.createServer(function (request, response) { });

server.listen(webSocketsServerPort, function () {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

var wsServer = new webSocketServer({ httpServer: server });

wsServer.on('request', function (request) {
  var connection = request.accept(null, request.origin);
  var path = resource(request.resource)
  var clientsObject = {
    path_id: path,
    connection: connection
  }

  var paging = {
    path_id: path[0],
    screen: path[1],
    data: connection
  }
  var index = clients.push(paging) - 1;
  // console.log(clients)

  connection.on('message', function (message) {
    //console.log(message)
  });

  connection.on('close', function (connection) {
    //clients.splice(index, 1);
    // console.log('client dc')
	console.log(index)
  });

});

var dsn = {
  host: 'localhost',
  user: 'developer',
  password: 'htp@developer'
}

var MySQLEvents = require('mysql-events');
var myCon = MySQLEvents(dsn);

var socketData = {}

var event1 = myCon.add(
  'rhis_analyzer.lppkn_device_order',
  function (oldRow, newRow, event) {
    if (oldRow !== null && newRow !== null) {
      console.log('broadcast message')
    }
    if (oldRow === null) {
      var data = {
        screen: "order",
        device_id: newRow.fields.device_id,
        sample_id: newRow.fields.sample_id,
        status: newRow.fields.flagged,
        analyzer_code: newRow.fields.device_id,
        lis_lab_id: socketData.lis_lab_id,
        client_name: socketData.client_name,
        order_by: socketData.order_by,
        planned_date: socketData.planned_date,
        client_id: socketData.client_id,
        analyzer_name: socketData.analyzer,
        test_code: socketData.test_code
      }
      broadcast_message(data)
    }
    if (newRow === null) {
      console.log(newRow)
      console.log('data deleted');
    }
  }
);

var event2 = myCon.add(
  'rhis_analyzer.lppkn_orders',
  function (oldRow, newRow, event) {
    if (oldRow !== null && newRow !== null) {
      console.log('.....')
      console.log('broadcast message')
    }
    if (oldRow === null) {
	console.log('.....')
      var order_data = JSON.parse(newRow.fields.order_detail)
      // var data = {
      //   screen: "order",
      //   status: "new order",
      //   lis_lab_id: order_data.lis_lab_id,
      //   client_name: order_data.client_name,
      //   order_by: order_data.order_by,
      //   planned_date: order_data.planned_date,
      //   client_id: order_data.client_id,
      //   analyzer_name: order_data.analyzer,
      //   analyzer_code: analyzer_code(order_data.analyzer),
      //   test_code: order_data.test_code
      // }
      // broadcast_message(data)
      socketData = order_data
      // console.log(data)
    }
    if (newRow === null) {
console.log('.....')
      console.log(newRow)
      console.log('data deleted');
    }
  }
);

var event3 = myCon.add(
  'rhis_analyzer.lppkn_result',
  function (oldRow, newRow, event) {
    if (oldRow !== null && newRow !== null) {
      console.log('broadcast message')
    }
    if (oldRow === null) {
//console.log(newRow.fields)
      var data = newRow.fields
      var result = {
        screen: "result",
        status: "",
        device_id: data.device_id,
        analyzer_code: data.device_id,
        row_id: data.id,
        timestamp: data.timestamp,
        transaction_code: data.transaction_code,
        result: JSON.parse(data.result)
      }
      console.log("result from " + data.device_id + " received")
      broadcast_message(result)
    }
    if (newRow === null) {
      console.log(newRow)
      console.log('data deleted');
    }
  }
)

function broadcast_message(data) {
  var sendmsg = JSON.stringify(data)
  for (var i = 0; i < clients.length; i++) {
    console.log(clients[i].path_id)
    console.log(data.analyzer_code)
    if (clients[i].path_id == data.analyzer_code){
      console.log(data)
      clients[i].data.sendUTF(sendmsg);
    }
  }
}

function analyzer_code(code) {
  console.log('check code: ' + code)
  let no = 0
  switch (code) {
    case 'cobas13':
      no = 3
      break;
    case 'cobas14':
      no = 2
      break;
    case 'sysmex350':
      no = 4
      break;
    case 'urysis':
      no = 1
      break;
  }
  return no
}

function resource(resourceUrl) {
  var path = resourceUrl.substring(1).split('/')
  return path
}