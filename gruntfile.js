const minimist = require('minimist')

const sass = require('sass')
const loadGruntTasks = require('load-grunt-tasks')

const argv = minimist(process.argv.slice(2))
const isProd = argv.production || argv.prod || false
const open = argv.open === undefined ? false : argv.open
const port = argv.port || 2080
const branch = argv.branch  === undefined ? 'gh-pages' : argv.branch

const config = {
    build: {
        src: 'src',
        dist: 'dist',
        temp: 'temp',
        public: 'public',
        paths: {
            styles: 'assets/styles/*.scss',
            scripts: 'assets/scripts/*.js',
            pages: '*.html',
            images: 'assets/images/**',
            fonts: 'assets/fonts/**',
        },
    },
    data: {
        menus: [
            {
                name: 'Home',
                icon: 'aperture',
                link: 'index.html',
            },
            {
                name: 'Features',
                link: 'features.html',
            },
            {
                name: 'About',
                link: 'about.html',
            },
            {
                name: 'Contact',
                link: '#',
                children: [
                    {
                        name: 'Twitter',
                        link: 'https://twitter.com/w_zce',
                    },
                    {
                        name: 'About',
                        link: 'https://weibo.com/zceme',
                    },
                    {
                        name: 'divider',
                    },
                    {
                        name: 'About',
                        link: 'https://github.com/zce',
                    },
                ],
            },
        ],
        pkg: require('./package.json'),
        date: new Date(),
    },
}

module.exports = (grunt) => {
    grunt.initConfig({
        // 样式规范检查
        stylelint: {
            options: {
                configFile: '.stylelintrc',
                formatter: 'string',
                ignoreDisables: false,
                failOnError: true,
                outputFile: '',
                reportNeedlessDisables: false,
                syntax: '',
                fix: true
            },
            src: ['src/assets/styles/*.scss']
        },
        //  js规范检查
        eslint: {
            target: ['src/assets/scripts/*.js']
        },
        // 清除目录
        clean: {
            dist: 'dist',
            temp: 'temp',
        },
        jshint: {
            build: ['src/assets/scripts/*.js'],
            options: {
                jshintrc: '.jshintrc',
            },
        },
        // 编译样式
        sass: {
            options: {
                sourceMap: !isProd,
                implementation: sass,
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['assets/styles/*.scss'],
                        dest: 'temp',
                        ext: '.css',
                    },
                ],
            },
        },
        // 编译脚本
        babel: {
            options: {
                sourceMap: !isProd,
                presets: ['@babel/preset-env'],
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['assets/scripts/*.js'],
                        dest: 'temp',
                    }
                ]
            }
        },
        // 页面编译
        swig: {
            page: {
                options: {
                    data: config.data,
                },
                expand: true,
                cwd: 'src',
                src: ['*.html'],
                dest: 'temp',
            }
        },
        // 处理图片和字体
        imagemin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['assets/{images, fonts}/*.{png,jpg,gif,svg}'],
                        dest: 'dist',
                    },
                ],
            },
        },
        // 监听文件变化
        watch: {
            js: {
                files: ['src/assets/scripts/*.js'],
                tasks: ['babel'],
            },
            css: {
                files: ['src/assets/styles/*.scss'],
                tasks: ['sass'],
            },
            page: {
                files: ['src/*.html'],
                tasks: ['swig'],
            },
        },
        // 启动本地服务
        browserSync: {
            dev: {
                bsFiles: {
                    src: [
                        'temp/assets/styles/*.css',
                        'temp/assets/scipts/*.js',
                        'temp/*.html',
                        'src/assets/fonts/**',
                        'src/assets/images/**',
                        'public/**',
                    ],
                },
                options: {
                    port,
                    open,
                    watchTask: true,
                    server: {
                        baseDir: ['temp', 'src', 'public'],
                        routes: {
                            '/node_modules': 'node_modules',
                        },
                    },
                },
            },
            dist: {
                options: {
                    port,
                    open,
                    server: {
                        baseDir: ['dist'],
                    },
                },
            },
        },
        // 拷贝文件
        copy: {
            public: {
                expand: true,
                cwd: 'public',
                src: '**',
                dest: 'dist/',
            },
            page: {
                expand: true,
                cwd: 'temp',
                src: '*.html',
                dest: 'dist/',
            }
        },
        useref: {
            // specify which files contain the build blocks
            html: 'temp/**/*.html',
            // explicitly specify the temp directory you are working in
            // this is the the base of your links ( '/' )
            temp: 'dist',
            root: 'temp/'
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true
                },
                files: [{
                    expand: true,
                    cwd: 'temp',
                    src: ['*.html'],
                    dest: 'dist'
                }]
            }
        },
        'gh-pages': {
            options: {
              base: 'dist'
            },
            src: ['**']
        }
    })

    const build = isProd ? ['clean', 'compile', 'imagemin', 'useref', 'concat', 'uglify', 'cssmin', 'copy', 'htmlmin'] : ['clean', 'compile', 'imagemin', 'useref', 'concat', 'copy']

    loadGruntTasks(grunt)

    // 编译js、scss、html
    grunt.registerTask('compile', ['babel', 'sass', 'swig'])

    // 本地服务
    grunt.registerTask('serve', ['compile', 'browserSync:dev', 'watch'])

    grunt.registerTask('default', [
        'compile',
        'useminPrepare',
        'concat',
        'cssmin',
        'uglify',
        'usemin',
    ])

    grunt.registerTask('lint', ['stylelint', 'eslint'])

    grunt.registerTask('build', build)

    grunt.registerTask('start', ['build', 'browserSync:dist'])

    grunt.registerTask('deploy', ['build', 'gh-pages'])
}
