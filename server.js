/**
 * 服务器代码
 * 启动服务器指令
 *  第一种方式启动：
 *      1、全局安装：npm i nodemon -g
 *      2、命令：nodemon server.js
 *  第二种方式启动：
 *      node server.js
 *      访问服务器地址：http://localhost:3000/
 * 
 * 这种方式，是将编译后的文件进行暴露，需要自己手动编译
 */
const express = require('express');
const app = express();
// 设置缓存1小时，当内容修改的时候，重新构建后，刷新页面没用，需要强制刷新页面
app.use(express.static('dist', {maxAge: 1000*3600}));
app.listen(3000);