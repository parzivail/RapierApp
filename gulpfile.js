/**
 * Created by Colby on 11/14/2017.
 */
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	pump = require('pump');

require('dotenv').config();

var jsSources = ['web/js/*.js'],
	htmlSources = ['web/*.html'],
	sassSources = ['web/css/style.scss'];

gulp.task('html', function (cb) {
	pump([
			gulp.src(htmlSources),
			gulp.dest("static/")
		],
		cb);
});

gulp.task('sass', function (cb) {
	pump([
			gulp.src(sassSources),
			sass(),
			gulp.dest("static/css")
		],
		cb);
});

gulp.task('js', function (cb) {
	pump([
			gulp.src(jsSources),
			uglify(),
			gulp.dest("static/js")
		],
		cb);
});

gulp.task('default', ['html', 'js', 'sass']);
