var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var Promise = require('es6-promise').Promise;
var concat = require('gulp-concat');

gulp.task('corejs', function () {
    return gulp.src([
        'node_modules/jquery-mask-plugin/dist/jquery.mask.min.js',
        'node_modules/jquery-form/dist/jquery.form.min.js',
        'core/frontend/jquery.rmodal.js',
        'core/frontend/jquery.rtooltip.js',
        'core/frontend/rockform.js'
    ])
        .pipe(concat('rockform.js'))
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest('dist/'));

});


gulp.task('css', function () {
    return gulp.src('core/themes/default/less/main.less')
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'IE 10', 'IE 11'],
            cascade: false
        }))
        .pipe(minifyCSS({
            keepBreaks: true
        }))
        .pipe(gulp.dest('core/themes/default/'));
});


gulp.task('watch', function () {
    gulp.watch('core/themes/default/less/*.less', ['css']),
        gulp.watch('core/frontend/rockform.js', ['corejs']),
        gulp.watch('core/frontend/jquery.rmodal.js', ['corejs']),
        gulp.watch('core/frontend/jquery.rtooltip.js', ['corejs'])
});

gulp.task('default', ['watch']);