'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_orders')
const { Order } = require('../../lib/models')
const bfx = require('../bfx')
const ws = bfx.ws(2)

ws.on('error', (err) => {
  console.log(err)
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.once('auth', () => {
  debug('authenticated')

  // Build new order
  const o = new Order({
    cid: Date.now(),
    symbol: 'tBTCUSD',
    price: 589.10,
    amount: -0.02,
    type: Order.type.EXCHANGE_LIMIT
  }, ws)

  let closed = false

  // Enable automatic updates
  o.registerListeners()

  o.on('update', () => {
    debug('order updated: %j', o.serialize())
  })

  o.on('close', () => {
    debug('order closed: %s', o.status)
    closed = true
  })

  debug('submitting order %d', o.cid)

  o.submit().then(() => {
    debug('got submit confirmation for order %d [%d]', o.cid, o.id)

    // wait a bit...
    setTimeout(() => {
      if (closed) return

      debug('canceling...')

      o.cancel().then(() => {
        debug('got cancel confirmation for order %d', o.cid)
      }).catch((err) => {
        debug('error cancelling order: %j', err)
      })
    }, 2000)
  }).catch((err) => {
    console.log(err)
  })
})

ws.open()
