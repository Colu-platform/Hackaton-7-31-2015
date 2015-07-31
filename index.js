var express = require('express')
var Colu = require('colu')
var jf = require('jsonfile')
var express = require('express')
var bodyParser = require('body-parser')
var dbFileName = 'db.json'
var seed = '352a5640333f555977777c3f5e6e307d4f36283a3d205640334e25572f'

var db = jf.readFileSync(__dirname + '/' + dbFileName)
var app = express()
var colu = new Colu({
  network: 'testnet',
  privateSeed: seed
})

app.use(bodyParser.json())         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))

app.set('view engine', 'jade')

app.get('/getTickets', function (req, res, next) {
  return res.send('tickets', db)
})

app.post('/buyTicket', function (req, res, next) {
  var ticketName = req.body.ticketName
  var assetId = db[ticketName].assetId
  var address = req.body.address
  var fromAddress = db[ticketName].address

  var settings = {
    'from': fromAddress,
    'to': [{
      'address': address,
      'assetId': assetId,
      'amount': 1
    }]
  }
  colu.sendAsset(settings, function (err, result) {
    if (err) return next(err)
    db[ticketName].amount -= 1
    jf.writeFile(__dirname + '/' + dbFileName, db, function (err) {
      if (err) return next(err)
      res.send('success', result)
    })
  })
})

app.post('/addTickets', function (req, res, next) {
  var ticketName = req.body.ticketName
  var amount = req.body.amount
  var settings = {
    'asset_name': ticketName,
    'amount': amount
  }
  colu.issueAsset(settings, function (err, result) {
    if (err) return err
    db[ticketName] = {
      amount: result.receivingAddresses[0].amount,
      assetId: result.assetId,
      address: result.receivingAddresses[0].address
    }
    jf.writeFile(__dirname + '/' + dbFileName, db, function (err) {
      if (err) return next(err)
      res.send('tickets', db)
    })
  })
})

colu.init()

colu.on('connect', function () {
  app.listen(8080)
})
