"use strict";

const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');
const eslint = require('gulp-eslint');

gulp.task('default', () => {
  return gulp.start('test');
});

gulp.task('test', ['lint'], () => {
  return gulp.src(['test/test.js'], {read: false})
    .pipe(mocha());
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
