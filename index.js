#!/usr/bin/env node
var args = require('minimist')(process.argv.slice(2), {
    default : {
        user     : process.env['IMAP_USER'],
        password : process.env['IMAP_PASSWORD'],
        host     : process.env['IMAP_HOST'],
        port     : process.env['IMAP_PORT'],
        tls      : process.env['IMAP_TLS']
    }
})

console.log(args)

var Imap = require('./imap')
var imap = new Imap(args)

imap.on('ready', function() {
    console.log('outer ready')

    imap.once('mailbox-open', function(box) {
        imap.fetchSequence(1,box.messages.total, function(messages) {
            console.log(messages)
        })
        imap.startMailBoxStream(box.name)
    })

    imap.openMailBox('INBOX')
})

imap.connect()
