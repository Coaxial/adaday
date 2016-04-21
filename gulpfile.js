const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');

gulp.task('default', () => {
  return gulp.start('test');
});

gulp.task('test', () => {
  return gulp.src(['test/test.js'], {read: false})
    .pipe(mocha());
});
