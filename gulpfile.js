"use strict";

const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');
// istanbul requires the non-threaded gulp-mocha version
const mocha_istanbul = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence');

const test_files = 'test/**/*_test.js';
const test_helper_file = 'test/test_helper.js';
const lib_files = 'lib/**/*.js';
const app_file = 'index.js';
const min_coverage = 90;

gulp.task('default', () => {
  return gulp.start('lint_and_test');
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('pre-cov', function () {
  return gulp.src([lib_files, app_file])
    .pipe(istanbul({ includeUntested: true }))
    .pipe(istanbul.hookRequire());
});

gulp.task('cov', ['pre-cov'], () => {
  process.env.NOCK_BACK_MODE = 'lockdown';
  return gulp.src([test_files], { read: false })
    .pipe(mocha_istanbul({ reporter: 'dot' }))
    .pipe(istanbul.writeReports())
    .pipe(istanbul.enforceThresholds({ thresholds: { global: min_coverage } }));
});

gulp.task('test', () => {
  process.env.NOCK_BACK_MODE = 'lockdown';
  return gulp.src([test_files], { read: false })
    .pipe(mocha())
});

// Use this when developing
gulp.task('dev', () => {
  const all_js_files = [lib_files, test_files, test_helper_file, app_file];
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

gulp.task('ci', (done) => {
  return runSequence(
    'lint',
    'cov',
    done
  );
});
