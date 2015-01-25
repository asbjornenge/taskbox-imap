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
args.taskbox = require('js-md5')(args.user)

var Imap     = require('./imap')
var imap     = new Imap(args)
var Firebase = require('./firebase')
var firebase = new Firebase(args)

console.log(args)

firebase.on('ready', function() {
    imap.on('ready', function() {
        imap.once('mailbox-open', function(box) {
            imap.fetchSequence(1,box.messages.total, function(messages) {
                console.log('MESSAGES', Object.keys(messages).length)
                firebase.addToTaskBox(messages[Object.keys(messages)[0]])
//              imap.startMailBoxStream(box.name)
            })
        })
        imap.openMailBox('INBOX')
    })
    imap.connect()
})
firebase.connect()
