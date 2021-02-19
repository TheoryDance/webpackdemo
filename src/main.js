// require是commonJS规范引入
// import是es6的语法标准
import $ from 'jquery';
import data from './data.json';

// es6模块化
import './main.css';
// commonJS模块化
// require('./main.css');

console.log($);
console.log(data);


// 注册serviceWorker
// 处理兼容性问题
if ('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
        navigator.serviceWorker.register('/service-worker.js')
            .then(()=>{
                console.log("sw注册成功了~");
            })
            .catch(()=>{
                console.log("sw注册失败了~");
            })
    });
}