"use strict";

const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence');

const test_files = 'test/**/*_test.js';
const lib_files = 'lib/**/*.js';
const app_file = 'index.js';

gulp.task('default', () => {
  return gulp.start('lint_and_test');
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test', () => {
  process.env.NOCK_BACK_MODE = 'lockdown';
  return gulp.src([test_files], { read: false })
    .pipe(mocha());
});

// Use this when developing
gulp.task('dev', () => {
  const all_js_files = [lib_files, test_files, app_file];
  gulp.watch(all_js_files, ['lint_and_test'], { read: false });
});

// Composite tasks
gulp.task('lint_and_test', (done) => {
  return runSequence(
    'lint',
    'test',
    done
  );
});
