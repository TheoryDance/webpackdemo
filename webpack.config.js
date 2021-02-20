/**
 * 开发环境配置，能让代码运行起来
 *   运行项目指令：
 *      webpack 会将打包结果输出 出去
 *      npx webpack-dev-server 只会在内存中编译打包，没有输出 
 * 
 * HMR: hot module replacement 热模块替换
 *  作用： 一个模块发生变化，只会重新打包这一个模块（而不是打包所有模块）
 *      极大提升构建速度
 * 
 *      样式文件： 可以使用HMR功能，因为style-loader内部实现了
 *      js文件：默认不能使用HMR功能
 *      html文件：默认不能使用HMR功能，同时会导致问题：html文件不能热更新了
 *          解决：修改entry入口，将html文件引入
 * 缓存：
 *      babel缓存，直接在babel-loader中配置对应属性即可
 *          cacheDirectory: true
 *          --> 让第二次打包构建速度更快
 *      文件资源缓存
 *          hash: 每次webpack构建时会生成一个唯一的hash值
 *            问题：因为js和css同时使用一个hash值，
 *              如果重新打包，会导致所有缓存实效，可能我只改动了一个文件
 *          chunkhash: 根据chunk生成的hash值，如果打包来源于同一个chunk，那么hash值就一样
 *          contenthash：根据文件的内容生成hash值。不同文件hash值一定不同
 *          --> 让代码上线运行缓存更好使用，上线代码性能优化
 * tree shaking：去除无用代码
 *  前提：1.必须使用ES6模块化；2.开启production环境
 * code split：代码分割
 * PWA: 离线缓存
 * 多线程打包，thread-loader,一般给babel-loader使用，需要在babel-loader中进行配置 
 * 
 */
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 用于将css样式，单独提取成一个文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 压缩css文件使用的插件
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
// PWA使用的插件
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
// 使用dll打包生成manifest.json文件后，需要进行引用里面的内容而引入该插件
const Webpack = require('webpack');
const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin');

// 定义nodejs环境变量，决定使用browslist的哪个环境
process.env.NODE_ENV  = 'development';


// 复用loader
const commonCssLoader = [
    //'style-loader', 
    //  单独提取css文件的loader
    MiniCssExtractPlugin.loader,
    'css-loader',
    {
        // 还需要在package.json中定义browserslist,通过该配置加载指定的css兼容性样式
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                ident: 'postcss',
                // postcss的插件
                plugins: () => [require('postcss-preset-env')()]
            }
        }
    }
]

module.exports = {
    entry: ['./src/main.js', './src/index.html'],
    output: {
        filename: 'js/[name].[contenthash:10].js',
        path: resolve(__dirname, './dist')
    },
    module: {
        rules: [
            {
                // 代码规范校验，使用airbnb，在package.json中eslintCOnfig -->  airbnb
                /**
                 * 语法检查： eslint-loader eslint
                 *  注意：只检查自己写的源代码，第三方的库是不需要检查的
                 *  设置检查规则：
                 *      package.json中eslintConfig中设置
                 *          "eslintConfig": {
                 *              "extends": "airbnb-base"
                 *              "env": {
                 *                  "browser": true // 支持浏览器端全局变量，不然eslint不能识别window或navigator等变量
                 *              }
                 *          }
                 *  airbnb --> eslint-config-airbnb-base eslint-plugin-import eslint
                 *  当某一行不需要检查语法时：
                 *      使用 // eslint-disable-next-line
                 */
                test: /\.js$/,
                exclude: /node_modules/,
                // 一般同一个文件，只有一个loader处理，当被多个loader处理的时候，需要注意先后顺序，通过该属性进行设置
                enforce: 'pre',
                loader: 'eslint-loader',
                options: {
                    // 自动修正语法，修复eslint的错误
                    fix: true
                }
            },
            {
                // 以下规则只会匹配一次
                oneOf: [
                    {
                        test: /\.css$/,
                        use: [...commonCssLoader]
                    },
                    {
                        test: /\.less$/,
                        use: [...commonCssLoader, 'less-loader']
                    },
                    {
                        // 处理图片资源，默认使用es解析，需要 设置为commonJS解析,url-loader是基于file-loader的
                        test: /\.(png|svg|jpg|gif|webp)$/,
                        loader: 'url-loader',
                        options:  {
                            limit: 8*1024,
                            name: '[hash:10].[ext]',
                            // 关闭es6模块化
                            esModule: false,
                            outputPath: 'imgs'
                        }
                    },
                    {
                        // 处理html中的图片，使用commonJS方式解析
                        test: /\.html$/,
                        loader: 'html-loader'
                    },
                    {
                        // 将es6+的语法，编译成es5及以下，让所有的浏览器可以识别
                        /*
                            js兼容性处理：babel-loader @babel/core @babel/preset-env
                              1、基本js兼容性处理 --> @babel/preset-env
                                问题：只能转换基本语法，如es6的promise不能转换
                              2、全部js兼容性处理 --> @babel/polyfill
                                在js代码中使用 ```import '@babel/polyfill';```
                                问题：我只需要解决部分兼容性问题，但是将所有兼容性代码全部引入，导致文件体积太大了~~
        
                              3、需要做兼容性处理的就做，按需加载 --> core-js
                        */
                        test: /\.js$/,
                        exclude: /node_modules/,
                        use: [
                            /*
                            开启多进程打包
                            进程启动大概需要600ms，进程通信也有开销，只有工作消耗时间比较长才需要多进程打包，
                            这里是对babel-loader开启多线程打包，如果其他loader需要多线程打包也是 一样的做法，放在别的loader后面，
                            注意：loader的执行是反顺序执行的哟~
                            */
                            'thread-loader',
                            // {
                            //     loader: 'thread-loader',
                            //     options: {
                            //         workers:  2 // 指定进程数量
                            //     }
                            // },
                            {
                                loader: 'babel-loader',
                                options: {
                                    // 预设：指示babel做怎么样的兼容性处理
                                    presets: [
                                        [
                                            '@babel/preset-env',
                                            {
                                                // 按需进行兼容处理
                                                useBuiltIns: 'usage',
                                                // 指定core-js版本
                                                corejs: {version: 3},
                                                // 指定兼容性做到哪个版本浏览器
                                                targets: {
                                                    chrome: '60',
                                                    firefox: '60',
                                                    ie: '9',
                                                    safari: '10',
                                                    edge: '17'
                                                }
                                            }
                                        ]
                                    ],
                                    // 开启babel缓存，第二次构件时，会读取之前的缓存
                                    cacheDirectory: true
                                }
                            }
                        ]
                    },
                    {
                        // 处理其他资源，比如字体等 相关文件
                        exclude: /\.(html|js|json|css|less|png|svg|jpg|gif|webp)$/,
                        loader: 'file-loader',
                        options: {
                            name: '[hash:10].[ext]',
                            outputPath: 'media'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        // html模板指定
        new HtmlWebpackPlugin({
            template: './src/index.html',
            // 压缩html代码
            minify: {
                // 移除多余的空格
                collapseWhitespace: true,
                // 移除注解
                removeComments: true
            }
        }),
        // 将样式文件单独提取为一个文件
        new MiniCssExtractPlugin({
            //对输出的css文件进行重命名
            filename: 'css/built.[contenthash:10].css'
        }),
        // css文件压缩
        new OptimizeCssAssetsWebpackPlugin(),
        /**
         * 生成一个serviceWorker 配置文件，需要在主js中注册serviceWorker，详细见src/main.js中的代码
         * sw代码必须运行在服务器上
         * -->nodejs
         * -->
         *  npm i serve -g
         *  serve -s build 启动服务器，将build目录下的所有资源作为静态资源暴露出去
         */
        new WorkboxWebpackPlugin.GenerateSW({
            /**
             * 1.帮助serviceWorker快速启动
             * 2.删除旧的serviceWorker 配置文件
             */
            clientsClaim: true,
            skipWaiting: true
        }),
        // 告诉webpack哪些库不参与打包同时使用时的名称也得变~(只是告诉不参与打包)
        new Webpack.DllReferencePlugin({
            manifest: resolve(__dirname,  'dll/manifest.json')
        }),
        /* 将某个文件打包输出去，并在html中自动引入该资源
			这个是引用项目中的文件，如果是引用外部网站的文件，则直接通过script标签即可
		 */
        new AddAssetHtmlWebpackPlugin({
            filename: resolve(__dirname, 'dll/jquery.js')
        })
    ],
    /* 
        1.可以将node_modules中代码单独打包一个chunk最终输出
        2.自动分析多入口chunk中，有没有公共的文件（要超过几十kb）。如果有会打包成单独一个chunk，不会重复打包。
    */
    optimizetion: {
        splitChunks: {
            chunks: 'all'
        }
    },
    // 使用production环境，会自动压缩js文件
    //mode: 'production',
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        // 构建后的目录
        contentBase: resolve(__dirname, 'dist'),
        // 启用gzip压缩
        compress: true,
        port: 3000,
        // 自动打开浏览器
        open: true,
        // 启用HMR
        hot: true
    },
    externals: {
        // 忽略jquery被打包进来，注意，这样的话，需要手动将jquery的包通过script标签引入到html中
        jquery: 'jQuery'
    }
}