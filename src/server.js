import Koa from 'koa'
import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import { router_v1, router_v2 } from './routes'
import http from 'http'
import socket_io from 'socket.io'
import pino from 'pino'
import debug from 'debug'
import uuid_v4 from 'uuid/v4'

const app = new Koa()

/**
 * error handler
 */
onerror(app)

/**
 * middlewares
 */
app.use(
  bodyparser({
    formLimit: '10mb',
    jsonLimit: '10mb',
    enableTypes: ['json', 'form', 'text'],
  }),
)
app.use(json())
app.use(logger())

/**
 * logger
 */
app.use(async (ctx, next) => {
  const start = new Date()
  const request_id = uuid_v4()
  try {
    ctx.request_id = request_id
    await next()
  } catch (error) {
    pino({ name: 'server.js' }).info({
      request_id,
      msg: `error_message => ${error.message}`,
    })
    ctx.status = error.status
    ctx.body = {
      request_id,
      error_code: error.status,
      error_msg: error.message,
    }
  }
  const ms = new Date() - start
  pino({ name: 'server.js' }).info({
    request_id,
    msg: `${ctx.method} ${ctx.url} - ${ms}ms`,
  })
})

/**
 * error-handling
 */
app.on('error', (error, ctx) => {
  pino({ name: 'server.js' }).info(`server error => ${error}, ${ctx}`)
})

process.on('uncaughtException', function(error) {
  pino({ name: 'server.js' }).info(
    `project - uncaughtException - ${error.message}`,
  )
})

app.use(router_v1().routes())
app.use(router_v1().allowedMethods())
app.use(router_v2().routes())
app.use(router_v2().allowedMethods())

const port = process.env.PORT || 3000

/**
 * Create HTTP server.
 */
const server = http.createServer(app.callback())
server.listen(port, error => {
  pino({ name: 'server.js' }).info(
    `app server started on port: ${port} in ${process.env.NODE_ENV}
  `,
  )
  if (error) throw error
})

/**
 * Create HTTP server.
 */
// app.listen(port, error => {
//  if (error) throw error
//   pino({ name: 'server.js' }).info(`app server started on port: ${port} in ${process.env.NODE_ENV}`)
// })

server.on('error', onError)
server.on('listening', onListening)

socket_io(server).on('connection', socket => {
  pino({ name: 'server.js' }).info('io_socket connection')
  socket.emit('news', { message: 'Hello World' })
  socket.on('check', data => {
    pino({ name: 'server.js' }).info(`io_socket check ${data}`)
  })
})

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('demo:server')('Listening on ' + bind)
}
