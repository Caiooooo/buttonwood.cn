(function (global) {

  // Define Bideo constructor on the global object
  global.Bideo = function () {

    // Plugin options
    this.opt = null;
    // The Video element
    this.videoEl = null;

    this.approxLoadingRate = null;

    // Methods to which `this` will be bound
    this._resize = null;
    this._progress = null;

    // Time at which video is initialized
    this.startTime = null;

    this.onLoadCalled = false;

    // Initialize and setup the video in DOM`
    this.init = function (opt) {
      // If not set then set to an empty object
      this.opt = opt = opt || {};

      var self = this;

      self._resize = self.resize.bind(this);

      // Video element
      self.videoEl = opt.videoEl;

      // Meta data event
      self.videoEl.addEventListener('loadedmetadata', self._resize, false);

      // Fired when enough has been buffered to begin the video
      // self.videoEl.readyState === 4 (HAVE_ENOUGH_DATA)
      self.videoEl.addEventListener('canplay', function () {
        self.opt.onLoad && self.opt.onLoad();
        if (self.opt.autoplay !== false) self.videoEl.play();
      }
      );

      // If resizing is required (resize video as window/container resizes)
      if (self.opt.resize) {
        global.addEventListener('resize', self._resize, false);
      }

      // Start time of video initialization
      this.startTime = (new Date()).getTime();

      // Create `source` for video
      this.opt.src.forEach(function (srcOb, i, arr) {
        var key
          , val
          , source = document.createElement('source');

        // Set all the attribute key=val supplied in `src` option
        for (key in srcOb) {
          if (srcOb.hasOwnProperty(key)) {
            val = srcOb[key];

            source.setAttribute(key, val);
          }
        }

        self.videoEl.appendChild(source);
      });


      return;
    }

    // Called once video metadata is available
    //
    // Also called when window/container is resized
    this.resize = function () {
      // IE/Edge still don't support object-fit: cover
      if ('object-fit' in document.body.style) return;

      // Video's intrinsic dimensions
      var w = this.videoEl.videoWidth
        , h = this.videoEl.videoHeight;

      // Intrinsic ratio
      // Will be more than 1 if W > H and less if H > W
      var videoRatio = (w / h).toFixed(2);

      // Get the container DOM element and its styles
      //
      // Also calculate the min dimensions required (this will be
      // the container dimentions)
      var container = this.opt.container
        , containerStyles = global.getComputedStyle(container)
        , minW = parseInt(containerStyles.getPropertyValue('width'))
        , minH = parseInt(containerStyles.getPropertyValue('height'));

      // If !border-box then add paddings to width and height
      if (containerStyles.getPropertyValue('box-sizing') !== 'border-box') {
        var paddingTop = containerStyles.getPropertyValue('padding-top')
          , paddingBottom = containerStyles.getPropertyValue('padding-bottom')
          , paddingLeft = containerStyles.getPropertyValue('padding-left')
          , paddingRight = containerStyles.getPropertyValue('padding-right');

        paddingTop = parseInt(paddingTop);
        paddingBottom = parseInt(paddingBottom);
        paddingLeft = parseInt(paddingLeft);
        paddingRight = parseInt(paddingRight);

        minW += paddingLeft + paddingRight;
        minH += paddingTop + paddingBottom;
      }

      // What's the min:intrinsic dimensions
      //
      // The idea is to get which of the container dimension
      // has a higher value when compared with the equivalents
      // of the video. Imagine a 1200x700 container and
      // 1000x500 video. Then in order to find the right balance
      // and do minimum scaling, we have to find the dimension
      // with higher ratio.
      //
      // Ex: 1200/1000 = 1.2 and 700/500 = 1.4 - So it is best to
      // scale 500 to 700 and then calculate what should be the
      // right width. If we scale 1000 to 1200 then the height
      // will become 600 proportionately.
      var widthRatio = minW / w;
      var heightRatio = minH / h;

      // Whichever ratio is more, the scaling
      // has to be done over that dimension
      if (widthRatio > heightRatio) {
        var new_width = minW;
        var new_height = Math.ceil(new_width / videoRatio);
      }
      else {
        var new_height = minH;
        var new_width = Math.ceil(new_height * videoRatio);
      }

      this.videoEl.style.width = new_width + 'px';
      this.videoEl.style.height = new_height + 'px';
    };

  };

}(window));

(function () {

  var bv = new Bideo();
  bv.init({
    // Video element
    videoEl: document.querySelector('#background_video'),

    // Container element
    container: document.querySelector('body'),

    // Resize
    resize: true,

    //isMobile: window.matchMedia('(max-width: 768px)').matches,

    // Array of objects containing the src and type
    // of different video formats to add
    src: [
      {
        src: 'img/vedio/49dbf46eae15d227fc95a69cee31251e.mp4',
        type: 'video/mp4'
      },
      {
        src: 'night.webm',
        type: 'video/webm;codecs="vp8, vorbis"'
      }
    ],

    // What to do once video loads (initial frame)
    onLoad: function () {
      document.querySelector('#video_cover').style.display = 'none';
    }
  });
}());
