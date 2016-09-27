var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('webrtc', { title : 'webrtc', curr_url: req.headers.host + req.originalUrl });
});

/* GET home page. */
router.get('/r/:id', function(req, res, next) {
    
  res.render('webrtc', { title : 'webrtc', id :  req.params.id, curr_url: req.headers.host + req.originalUrl});
});



module.exports = router;

/* GET users listing. */
// var returnVideoRouter = function(io) {
//     router.get('/', function(req, res, next) {
//         io.on('connection', function(socket){
//             console.log('又一client 上线了～');
//             socket.on('client_msg', function(msg){
//                 console.log('服务端收到客户端发来消息：' + msg);
//                 io.emit('server_msg', msg);
//                 console.log('服务端把消息：' + msg + ' 回传给客户端');
//             });
//         });
        
//         //res.send('hello,this is video server');
//         res.render('video', { title: 'Video' });
//     });
//     return router;
// }


// module.exports = returnVideoRouter;
