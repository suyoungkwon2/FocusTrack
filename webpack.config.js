const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        background: './src/background.ts',
        content: './src/content.ts',
        'pages/test': './src/pages/test.ts',
        'pages/settings': './src/pages/settings.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@src': path.resolve(__dirname, 'src/'),
            '@services': path.resolve(__dirname, 'src/services/'),
            '@utils': path.resolve(__dirname, 'src/utils/'),
            '@types': path.resolve(__dirname, 'src/types/')
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { 
                    from: 'src/manifest.json', 
                    to: 'manifest.json' 
                },
                { 
                    from: 'src/pages/test.html', 
                    to: 'pages/test.html' 
                },
                { 
                    from: 'src/pages/test.css', 
                    to: 'pages/test.css' 
                }
            ]
        })
    ]
}; 