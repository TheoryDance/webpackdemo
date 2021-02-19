
/*
    使用dll技术，对某些库（第三方库：jquery、react、vue...）进行单独打包
    当运行webpack时，默认 查找 webpack.config.js配置文件
    需求：需要运行webpack.dll.js文件
    --> webpack --config webpack.dll.js

*/
const { resolve } = require('path');
const Webpack = require('webpack');

module.exports = {
    entry: {
        // key为 最终打包生成的[name]
        // value是要打包的库
        jquery: ['jquery']
    },
    output: {
        filename: '[name].js',
        path: resolve(__dirname, 'dll'),
        library: '[name]_[hash:10]', // 打包的库里面向外暴露出去的内容叫什么名字 
    },
    plugins: [
        // 打包生成一个manifest.json --> 提供和jquery映射关系
        new Webpack.DllPlugin({
            name: '[name]_[hash:10]', // 映射库的暴露的内容名称
            path: resolve(__dirname, 'dll/manifest.json') // 输出文件路径
        })
    ],
    mode: 'production'
}
