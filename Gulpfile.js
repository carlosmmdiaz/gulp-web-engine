// Gulp tasks description:
// gulp: Default task that builds the App and starts BroswerSync.
// gulp build: Task that builds the App for distribution.
// gulp deploy: Task that builds and deploy using ftp the App.
'use strict';
var gulp = require('gulp'),
	clean = require('gulp-clean'),
	sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    htmlmin = require('gulp-html-minifier'),
    uglify = require('gulp-uglifyjs'),
    replace = require('gulp-replace'),
    fs = require('fs'),
    runSequence = require('run-sequence'),
    gutil = require('gulp-util'),
    ftp = require('vinyl-ftp'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload;
// Setup:
var config = {
    name: {
        css: 'main.min.css',
        js: 'main.min.js'
    },
    src: {
        sass: 'resources/sass/*.scss',
        img: ['resources/img/**/*.png', 
              'resources/img/**/*.gif', 
              'resources/img/**/*.jpg'],
        icons: 'resources/icons/*.png',
        css: 'vendors/css/',
        fonts: 'vendors/fonts/*',
        js: ['vendors/js/jquery-1.11.2.min.js', // Order is important
             'vendors/js/*.min.js', 
             'resources/js/*.js'],
        html: './*.html',
        pdf: 'resources/pdf/*.pdf',
        seo: 'resources/seo/*'
    },
    watch: {
        sass: ['resources/sass/*.scss', 'resources/sass/**/*.scss'],
        js: ['resources/js/*.js', 'vendors/js/*.min.js'],
        html: ['*.html']
    },
    dev: {
        folder: '.tmp',
        html: '.tmp/*.html',
        css: '.tmp/resources/css',
        fonts: '.tmp/fonts',
        img: '.tmp/resources/img',
        icons: '.tmp/resources/icons',
        js: '.tmp/resources/js',
        pdf: '.tmp/resources/pdf'
    },
    dist: {
        folder: 'dist',
        files: '.tmp/**'
    },
    ftp: {
        host: '',
        user: '',
        password: '',
        uploadPath: 'httpdocs/',
        files: ['dist/**']
    }
};
// Developer tasks:
gulp.task('clean-dev', function () {
    return gulp.src(config.dev.folder, {read: false})
        .pipe(clean());
});
gulp.task('clean-dist', function () {
    return gulp.src(config.dist.folder, {read: false})
        .pipe(clean());
});
gulp.task('html-dev', function() {
    return gulp.src(config.src.html)
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(config.dev.folder))
});
gulp.task('sass-dev', function(){
    return gulp.src(config.src.sass)
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('./' + config.src.css));
});
gulp.task('css-dev', ['sass-dev'], function() {
    return gulp.src(config.src.css + '*.css')
        .pipe(concat(config.name.css))
        .pipe(gulp.dest(config.dev.css));
});
gulp.task('embedCss-dev', ['css-dev', 'html-dev'], function() {
    return gulp.src(config.dev.html)
        .pipe(replace(/<link rel="stylesheet"[^>]*>/, function(s) {
            var style = fs.readFileSync(config.dev.css + '/' + config.name.css, 'utf8');
            return '<style amp-custom>\n' + style + '\n</style>';
    })).pipe(gulp.dest(config.dev.folder));
});
gulp.task('img-dev', function() {
    return gulp.src(config.src.img)
        .pipe(gulp.dest(config.dev.img));
});
gulp.task('icons-dev', function() {
    return gulp.src(config.src.icons)
        .pipe(gulp.dest(config.dev.icons));
});
gulp.task('fonts-dev', function() {
    return gulp.src(config.src.fonts)
        .pipe(gulp.dest(config.dev.fonts));
});
gulp.task('js-dev', function() {
    return gulp.src(config.src.js)
        .pipe(uglify(config.name.js))
        .pipe(gulp.dest(config.dev.js))
});
gulp.task('pdf-dev', function() {
    return gulp.src(config.src.pdf)
        .pipe(gulp.dest(config.dev.pdf));
});
gulp.task('seo-dev', function() {
    return gulp.src(config.src.seo)
        .pipe(gulp.dest(config.dev.folder));
});
gulp.task('move-dist', function() {
    return gulp.src(config.dist.files, { base: './' + config.dev.folder })
        .pipe(gulp.dest(config.dist.folder));
});
// Build tasks: 
gulp.task('build-dev', ['clean-dev'], function() {
    return runSequence('embedCss-dev',
                       'js-dev', 
                       'fonts-dev', 
                       'img-dev', 
                       'icons-dev', 
                       'pdf-dev',
                       'seo-dev');
});
gulp.task('build', ['clean-dist'], function() {
    return runSequence('embedCss-dev',
                       'js-dev', 
                       'fonts-dev', 
                       'img-dev', 
                       'icons-dev', 
                       'pdf-dev',
                       'seo-dev',
                       'move-dist');
});
// Deploy tasks:
gulp.task('deploy-ftp', function() {
    var conn = ftp.create( {
        host:     config.ftp.host,
        user:     config.ftp.user,
        password: config.ftp.password,
        parallel: 10,
        log:      gutil.log
    });
    return gulp.src(config.ftp.files, { base: './dist/', buffer: false })
        .pipe(conn.newer(config.ftp.uploadPath)) // only upload newer files 
        .pipe(conn.dest(config.ftp.uploadPath));
});
gulp.task('deploy', function() {
   return runSequence('embedCss-dev',
                       'js-dev', 
                       'fonts-dev', 
                       'img-dev', 
                       'icons-dev', 
                       'pdf-dev',
                       'seo-dev',
                       'move-dist',
                       'deploy-ftp');
});
// Reload tasks:
gulp.task('css-reload', ['embedCss-dev'], function (done) {
    browserSync.reload();
    done();
});
gulp.task('js-reload', ['js-dev'], function (done) {
    browserSync.reload();
    done();
});
gulp.task('html-reload', ['embedCss-dev'], function (done) {
    browserSync.reload();
    done();
});
// Default gulp task with browserSync:
gulp.task('default', ['build-dev'], function() {
    browserSync.init({
        server: {
            baseDir: config.dev.folder
        }
    });
    // Watches:
    setTimeout(function(){ 
        gulp.watch(config.watch.sass, ['css-reload']);
        gulp.watch(config.watch.js, ['js-reload']);
        gulp.watch(config.watch.html, ['html-reload']);
    }, 5000);
});