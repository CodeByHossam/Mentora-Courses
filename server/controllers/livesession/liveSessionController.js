module.exports = {
  ...require('./liveSessionCoreController'),
  ...require('./liveSessionControlController'),
  ...require('./liveSessionRecordingController'),
  ...require('./liveSessionZoomController'),
};

// Backward-compatible barrel.