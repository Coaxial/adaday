const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');

gulp.task('default', () => {
  // place code for your default task here
});

gulp.task('test', () => {
  return gulp.src(['test/test.js'], {read: false})
    .pipe(mocha());
});
