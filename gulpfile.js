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

var sassSources = ['web/scss/style.scss'];

gulp.task('sass', function (cb) {
	pump([
			gulp.src(sassSources),
			sass(),
			concat('style.css'),
			gulp.dest("web/css")
		],
		cb);
});

gulp.task('default', ['sass']);
