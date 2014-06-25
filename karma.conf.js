module.exports = function(config) {
  config.set({
    basePath: '../..',
    frameworks: ['jasmine'],
    reporters: ['progress'],
    colors: true,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 6000,
    singleRun: true
  });
};