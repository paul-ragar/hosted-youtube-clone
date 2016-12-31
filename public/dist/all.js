'use strict';

/*!
 * angular-loading-bar v0.9.0
 * https://chieffancypants.github.io/angular-loading-bar
 * Copyright (c) 2016 Wes Cruver
 * License: MIT
 */
/*
 * angular-loading-bar
 *
 * intercepts XHR requests and creates a loading bar.
 * Based on the excellent nprogress work by rstacruz (more info in readme)
 *
 * (c) 2013 Wes Cruver
 * License: MIT
 */

(function () {

  'use strict';

  // Alias the loading bar for various backwards compatibilities since the project has matured:

  angular.module('angular-loading-bar', ['cfp.loadingBarInterceptor']);
  angular.module('chieffancypants.loadingBar', ['cfp.loadingBarInterceptor']);

  /**
   * loadingBarInterceptor service
   *
   * Registers itself as an Angular interceptor and listens for XHR requests.
   */
  angular.module('cfp.loadingBarInterceptor', ['cfp.loadingBar']).config(['$httpProvider', function ($httpProvider) {

    var interceptor = ['$q', '$cacheFactory', '$timeout', '$rootScope', '$log', 'cfpLoadingBar', function ($q, $cacheFactory, $timeout, $rootScope, $log, cfpLoadingBar) {

      /**
       * The total number of requests made
       */
      var reqsTotal = 0;

      /**
       * The number of requests completed (either successfully or not)
       */
      var reqsCompleted = 0;

      /**
       * The amount of time spent fetching before showing the loading bar
       */
      var latencyThreshold = cfpLoadingBar.latencyThreshold;

      /**
       * $timeout handle for latencyThreshold
       */
      var startTimeout;

      /**
       * calls cfpLoadingBar.complete() which removes the
       * loading bar from the DOM.
       */
      function setComplete() {
        $timeout.cancel(startTimeout);
        cfpLoadingBar.complete();
        reqsCompleted = 0;
        reqsTotal = 0;
      }

      /**
       * Determine if the response has already been cached
       * @param  {Object}  config the config option from the request
       * @return {Boolean} retrns true if cached, otherwise false
       */
      function isCached(config) {
        var cache;
        var defaultCache = $cacheFactory.get('$http');
        var defaults = $httpProvider.defaults;

        // Choose the proper cache source. Borrowed from angular: $http service
        if ((config.cache || defaults.cache) && config.cache !== false && (config.method === 'GET' || config.method === 'JSONP')) {
          cache = angular.isObject(config.cache) ? config.cache : angular.isObject(defaults.cache) ? defaults.cache : defaultCache;
        }

        var cached = cache !== undefined ? cache.get(config.url) !== undefined : false;

        if (config.cached !== undefined && cached !== config.cached) {
          return config.cached;
        }
        config.cached = cached;
        return cached;
      }

      return {
        'request': function request(config) {
          // Check to make sure this request hasn't already been cached and that
          // the requester didn't explicitly ask us to ignore this request:
          if (!config.ignoreLoadingBar && !isCached(config)) {
            $rootScope.$broadcast('cfpLoadingBar:loading', { url: config.url });
            if (reqsTotal === 0) {
              startTimeout = $timeout(function () {
                cfpLoadingBar.start();
              }, latencyThreshold);
            }
            reqsTotal++;
            cfpLoadingBar.set(reqsCompleted / reqsTotal);
          }
          return config;
        },

        'response': function response(_response) {
          if (!_response || !_response.config) {
            $log.error('Broken interceptor detected: Config object not supplied in response:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
            return _response;
          }

          if (!_response.config.ignoreLoadingBar && !isCached(_response.config)) {
            reqsCompleted++;
            $rootScope.$broadcast('cfpLoadingBar:loaded', { url: _response.config.url, result: _response });
            if (reqsCompleted >= reqsTotal) {
              setComplete();
            } else {
              cfpLoadingBar.set(reqsCompleted / reqsTotal);
            }
          }
          return _response;
        },

        'responseError': function responseError(rejection) {
          if (!rejection || !rejection.config) {
            $log.error('Broken interceptor detected: Config object not supplied in rejection:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
            return $q.reject(rejection);
          }

          if (!rejection.config.ignoreLoadingBar && !isCached(rejection.config)) {
            reqsCompleted++;
            $rootScope.$broadcast('cfpLoadingBar:loaded', { url: rejection.config.url, result: rejection });
            if (reqsCompleted >= reqsTotal) {
              setComplete();
            } else {
              cfpLoadingBar.set(reqsCompleted / reqsTotal);
            }
          }
          return $q.reject(rejection);
        }
      };
    }];

    $httpProvider.interceptors.push(interceptor);
  }]);

  /**
   * Loading Bar
   *
   * This service handles adding and removing the actual element in the DOM.
   * Generally, best practices for DOM manipulation is to take place in a
   * directive, but because the element itself is injected in the DOM only upon
   * XHR requests, and it's likely needed on every view, the best option is to
   * use a service.
   */
  angular.module('cfp.loadingBar', []).provider('cfpLoadingBar', function () {

    this.autoIncrement = true;
    this.includeSpinner = false;
    this.includeBar = true;
    this.latencyThreshold = 100;
    this.startSize = 0.02;
    this.parentSelector = 'body';
    this.spinnerTemplate = '<div id="loading-bar-spinner"><div class="spinner-icon"></div></div>';
    this.loadingBarTemplate = '<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>';

    this.$get = ['$injector', '$document', '$timeout', '$rootScope', function ($injector, $document, $timeout, $rootScope) {
      var $animate;
      var $parentSelector = this.parentSelector,
          loadingBarContainer = angular.element(this.loadingBarTemplate),
          loadingBar = loadingBarContainer.find('div').eq(0),
          spinner = angular.element(this.spinnerTemplate);

      var incTimeout,
          completeTimeout,
          started = false,
          status = 0;

      var autoIncrement = this.autoIncrement;
      var includeSpinner = this.includeSpinner;
      var includeBar = this.includeBar;
      var startSize = this.startSize;

      /**
       * Inserts the loading bar element into the dom, and sets it to 2%
       */
      function _start() {
        if (!$animate) {
          $animate = $injector.get('$animate');
        }

        $timeout.cancel(completeTimeout);

        // do not continually broadcast the started event:
        if (started) {
          return;
        }

        var document = $document[0];
        var parent = document.querySelector ? document.querySelector($parentSelector) : $document.find($parentSelector)[0];

        if (!parent) {
          parent = document.getElementsByTagName('body')[0];
        }

        var $parent = angular.element(parent);
        var $after = parent.lastChild && angular.element(parent.lastChild);

        $rootScope.$broadcast('cfpLoadingBar:started');
        started = true;

        if (includeBar) {
          $animate.enter(loadingBarContainer, $parent, $after);
        }

        if (includeSpinner) {
          $animate.enter(spinner, $parent, loadingBarContainer);
        }

        _set(startSize);
      }

      /**
       * Set the loading bar's width to a certain percent.
       *
       * @param n any value between 0 and 1
       */
      function _set(n) {
        if (!started) {
          return;
        }
        var pct = n * 100 + '%';
        loadingBar.css('width', pct);
        status = n;

        // increment loadingbar to give the illusion that there is always
        // progress but make sure to cancel the previous timeouts so we don't
        // have multiple incs running at the same time.
        if (autoIncrement) {
          $timeout.cancel(incTimeout);
          incTimeout = $timeout(function () {
            _inc();
          }, 250);
        }
      }

      /**
       * Increments the loading bar by a random amount
       * but slows down as it progresses
       */
      function _inc() {
        if (_status() >= 1) {
          return;
        }

        var rnd = 0;

        // TODO: do this mathmatically instead of through conditions

        var stat = _status();
        if (stat >= 0 && stat < 0.25) {
          // Start out between 3 - 6% increments
          rnd = (Math.random() * (5 - 3 + 1) + 3) / 100;
        } else if (stat >= 0.25 && stat < 0.65) {
          // increment between 0 - 3%
          rnd = Math.random() * 3 / 100;
        } else if (stat >= 0.65 && stat < 0.9) {
          // increment between 0 - 2%
          rnd = Math.random() * 2 / 100;
        } else if (stat >= 0.9 && stat < 0.99) {
          // finally, increment it .5 %
          rnd = 0.005;
        } else {
          // after 99%, don't increment:
          rnd = 0;
        }

        var pct = _status() + rnd;
        _set(pct);
      }

      function _status() {
        return status;
      }

      function _completeAnimation() {
        status = 0;
        started = false;
      }

      function _complete() {
        if (!$animate) {
          $animate = $injector.get('$animate');
        }

        $rootScope.$broadcast('cfpLoadingBar:completed');
        _set(1);

        $timeout.cancel(completeTimeout);

        // Attempt to aggregate any start/complete calls within 500ms:
        completeTimeout = $timeout(function () {
          var promise = $animate.leave(loadingBarContainer, _completeAnimation);
          if (promise && promise.then) {
            promise.then(_completeAnimation);
          }
          $animate.leave(spinner);
        }, 500);
      }

      return {
        start: _start,
        set: _set,
        status: _status,
        inc: _inc,
        complete: _complete,
        autoIncrement: this.autoIncrement,
        includeSpinner: this.includeSpinner,
        latencyThreshold: this.latencyThreshold,
        parentSelector: this.parentSelector,
        startSize: this.startSize
      };
    }]; //
  }); // wtf javascript. srsly
})(); //
'use strict';

angular.module('you-tube-clone', ['ui.router', 'ngSanitize', 'chieffancypants.loadingBar', 'ngAnimate', 'ui.sortable']).config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  $stateProvider.state('landing', {
    url: '/',
    templateUrl: './app/views/homeView.html'
  }).state('trending', {
    url: '/trending',
    templateUrl: './app/views/trendingView.html'
  }).state('video', {
    url: "/watch/:videoId",
    templateUrl: './app/views/videoPlayer/videoPlayer.html'
  }).state('searchResults', {
    url: "/searchResults?search_query",
    templateUrl: './app/views/searchResults.html',
    resolve: {
      searchResults: function searchResults($stateParams, mainService) {
        return mainService.getSearchResults($stateParams.search_query).then(function (response) {
          return response;
        });
      }
    },
    controller: function controller($scope, searchResults) {
      $scope.searchResults = searchResults;
      console.log("SearchResults RESULTS: ", searchResults);
    }
  }).state('auth', {
    url: '/sign-in',
    templateUrl: './app/views/signInView.html'
  }).state('playlist', {
    url: '/playlist',
    templateUrl: './app/views/playlist.html'
  }).state('channel', {
    url: '/channel/:channelId',
    templateUrl: './app/views/channel.html',
    resolve: {
      channelData: function channelData($stateParams, mainService) {
        return mainService.getChannelData($stateParams.channelId).then(function (response) {
          return response;
        });
      }
    },
    controller: function controller($scope, channelData) {
      $scope.channelData = channelData;
      console.log("channelData RESULTS: ", channelData);
    }
  });
});
'use strict';

angular.module('you-tube-clone').service('authService', function ($http) {

  this.registerUser = function (user) {
    return $http({
      method: 'POST',
      url: '/register',
      data: user
    }).then(function (response) {
      return response;
    });
  };

  this.getCurrentUser = function () {
    return $http({
      method: 'GET',
      url: '/me'
    });
  };

  this.addToPlaylist = function (video, user) {
    console.log('authService video and user: ', video, user);
    return $http({
      method: "POST",
      url: "/api/addVideo",
      data: {
        video: video,
        user: user
      }
    });
  };
});
'use strict';

angular.module('you-tube-clone').controller('mainCtrl', function ($scope, mainService, $filter, $timeout) {

  $scope.broken = mainService.broken;

  $scope.playlistIds = [{ id: "PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI", img: "./images/ham-bar-slide-out-images/category-music.jpg" }, { id: "PL8fVUTBmJhHJlT40aNl_cX4qcrVqoC5eg", img: "./images/ham-bar-slide-out-images/category-sports.jpg" }, { id: "PLiCvVJzBupKnXepW_381ILaaxaxK33vOv", img: "./images/ham-bar-slide-out-images/category-gaming.jpg" }, { id: "PLzjFbaFzsmMT_VuMSVQxfkQIw7VNbHyVi", img: "./images/ham-bar-slide-out-images/category-movies.jpg" }, { id: "PLg8RSSmVAw_Gk0qfrDMfOQ8k7gVdfKliP", img: "./images/ham-bar-slide-out-images/category-tv.jpg" }, { id: "PLU12uITxBEPHOJO1FU8qll6gQmKcXp5S7", img: "./images/ham-bar-slide-out-images/category-live.jpg" }, { id: "PL3ZQ5CpNulQldOL3T8g8k1mgWWysJfE9w", img: "./images/ham-bar-slide-out-images/category-news.jpg" }, { id: "PLbpi6ZahtOH7vgyGImZ4P-olTT11WLkLk", img: "./images/ham-bar-slide-out-images/category-spotlight.jpg" }, { id: "PLU8wpH_Lfhmsn0qJmVSyEXB9m3j1OkJWX", img: "./images/ham-bar-slide-out-images/category-threesixty.jpg" }];

  // $scope.landingPlaylists = [];
  // $scope.playLists = () => {
  //   mainService.getPlaylist($scope.channelIds.music).then((response) => {
  //     console.log('got music playlist');
  //     console.log(response);
  //     $scope.landingPlaylists.push(response);
  //     mainService.getPlaylist().then((response) => {
  //       $scope.landingPlaylists.push(response);
  //       console.log('got sports playlist');
  //       console.log(response);
  //       console.log($scope.landingPlaylists);
  //     })
  //   })
  // }


  //SOCKET IO

  $scope.chatBox = false;
  $scope.chatIcon = true;

  $timeout(function () {
    $('.chat-outer-container').css({
      "display": "inline-block"
    });
  }, 1000);

  var socket = io();
  $('form').submit(function () {
    if (!$scope.userChatName) {
      return;
    }
    $scope.date = $filter('date', new Date(), "h:mm a");
    console.log($scope.date);
    socket.emit('chat message', $scope.userChatName + ": " + $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function (msg) {
    $('#messages').append($('<li ng-model="text" class="singleChat" ng-bind-html="text | linky">').text(msg));
  });

  $scope.userChatName;
  $scope.hideChat = true;
  $scope.createChatName = function (name) {
    $scope.userChatName = name;
    $scope.hideChat = false;
  };
});
'use strict';

angular.module('you-tube-clone').service('mainService', function ($http, $state) {
  var _this = this;

  this.broken = 'working';

  this.getTrending = function () {
    return $http({
      method: 'GET',
      url: '/api/trending'
    }).then(function (response) {
      // console.log('hello from the mainnService',response);
      return response.data;
    });
  };
  this.singleVid = [];
  this.passVideo = function (video) {
    _this.singleVid[0] = video;
  };

  this.getVideoInfo = function (id) {
    return $http({
      method: 'GET',
      url: '/api/watch/?id=' + id
    }).then(function (response) {
      return response.data;
    });
  };

  this.getComments = function (id) {

    return $http({
      method: 'GET',
      url: '/api/comments/?id=' + id
    }).then(function (response) {

      return response.data;
    });
  };

  this.getSearchResults = function (searched) {
    // console.log("searched: ", searched);
    // searched = searched + '';
    searched = searched.replace(/ /g, "%20");
    return $http({
      method: 'GET',
      url: '/api/search?searched=' + searched
    }).then(function (response) {
      // console.log("From the mainService: ",response.data);
      return response.data;
    });
  };

  this.getChannelInfoOnVidPlayer = function (id) {
    return $http({
      method: 'GET',
      url: '/api/channelInfo/?id=' + id
    }).then(function (response) {
      return response.data;
    });
  };

  this.getHomePlaylist = function (id) {
    return $http({
      method: 'GET',
      url: '/api/playList/?id=' + id
    }).then(function (response) {
      return response.data;
    });
  };

  this.getChannelHoverInfo = function (id) {
    // console.log("mainService :", id);
    return $http({
      method: 'GET',
      url: '/api/channelHoverInfo/?id=' + id
    }).then(function (response) {
      // console.log("response: ", response);
      // console.log("Hover Array",response.data.items[0]);
      return response.data.items[0];
    });
  };

  this.getPlaylistInfo = function (id) {
    return $http({
      method: 'GET',
      url: '/api/playlistInfo/?playlistId=' + id
    }).then(function (response) {
      return response.data;
    });
  };

  this.getPlaylist = function () {
    return $http({
      method: 'GET',
      url: "/api/user-playlist/",
      data: {
        user: user
      }
    }).then(function (response) {
      return response.data;
    });
  };

  this.registerUser = function (user) {
    return $http({
      method: 'POST',
      url: '/register',
      data: user
    }).then(function (response) {
      return response;
    });
  };

  this.getCurrentUser = function () {
    return $http({
      method: 'GET',
      url: '/me'
    });
  };
  this.addToPlaylist = function (video, user) {
    console.log('authService video and user: ', video, user);
    return $http({
      method: "POST",
      url: "/api/addVideo",
      data: {
        video: video,
        user: user
      }
    });
  };

  this.getCurrentUserPlaylist = function (user) {
    return $http({
      method: 'GET',
      url: '/api/user/playlist/' + user.id
    }).then(function (response) {
      var vidArr = response.data;
      // var newVidArr = [];
      for (var i = 0; i < vidArr.length; i++) {
        vidArr[i].video = JSON.parse(vidArr[i].video);
      }

      return vidArr;
    });
  };

  this.postComment = function (comment, vidId, channelId) {
    return $http({
      method: 'POST',
      url: '/api/comments',
      data: {
        comment: comment,
        vidId: vidId,
        channelId: channelId
      }
    }).then(function (response) {
      return response.data;
    });
  };

  this.getChannelData = function (id) {
    return $http({
      method: 'GET',
      url: '/api/channelData/?id=' + id
    }).then(function (response) {
      return response.data.items[0];
    });
  };

  this.removeVideo = function (id) {
    return $http({
      method: 'DELETE',
      url: '/api/remove/playlist-video/' + id
    }).then(function (response) {
      console.log('did vid delete?', response.data);
      return response.data;
    });
  };
});
'use strict';

angular.module('you-tube-clone').directive('authDir', function () {
  return {
    restrict: 'E',
    templateUrl: './app/directives/authDir/authDir.html',
    controller: function controller($scope, authService) {

      $scope.register = function (user) {
        mainService.registerUser(user).then(function (response) {
          if (!response.data) {
            alert('unable to create user');
          } else {
            alert('user created');
            $scope.newUser = {};
          }
        }).catch(function (err) {
          alert('unable to create user');
        });
      };

      //END OF CONTROLLER
    }
    //END OF RETURN
  };
  //END OF DIRECTIVE
});
'use strict';

angular.module('you-tube-clone').directive('channelDir', function () {

  return {
    restrict: 'E',
    templateUrl: './app/directives/channelDir/channelDir.html',
    scope: {
      channelData: '='
    },
    controller: function controller($scope, $stateParams, $sce, $timeout, mainService) {

      $scope.moreDescription = {
        "overflow": "hidden"
      };
      $scope.readMoreShowLess = "Read More";

      $scope.channelTrailerId = $scope.channelData.brandingSettings.channel.unsubscribedTrailer;

      $scope.videoUrl = "https://www.youtube.com/embed/" + $scope.channelTrailerId + "?autoplay=1&origin=http://example.com";

      $scope.channelTrailer = $sce.trustAsResourceUrl($scope.videoUrl);

      $scope.convertTime = function (time) {
        time = moment(time, "YYYYMMDD").fromNow();
        return time;
      };

      $scope.readMore = function () {
        if ($scope.readMoreShowLess === "Read More") {
          $scope.moreDescription = {
            "overflow": "none",
            "max-height": "none"
          };
          $scope.readMoreShowLess = "Show Less";
        } else {
          $scope.moreDescription = {
            "overflow": "hidden",
            "max-height": "12.2em"
          };
          $scope.readMoreShowLess = "Read More";
        }
      };

      //END OF CONTROLLER
    }
    //END OF RETURN (DIRECTIVE)
  };
});
'use strict';

angular.module('you-tube-clone').directive('commentsDir', function () {
  return {
    restrict: 'E',
    templateUrl: './app/directives/commentsDir/commentsDir.html',
    scope: {
      vidId: '=',
      commentCount: '=',
      channelId: '='
    },
    controller: function controller($scope, mainService, $sce, $timeout) {
      $scope.$watch('vidId', function () {
        var vidId = $scope.vidId;

        if (vidId) {
          $scope.getComments = function (vidId) {
            mainService.getComments(vidId).then(function (response) {
              $scope.comments = response;
            });
          };
          $scope.getComments(vidId);
        }

        $scope.postComment = function (comment, vidId, channelId) {
          mainService.postComment(comment, vidId, channelId).then(function (response) {
            $scope.newComment = response;

            $timeout(function () {
              $scope.getComments = function (vidId) {
                mainService.getComments(vidId).then(function (response) {
                  $scope.comments = response;
                });
              };
              $scope.getComments(vidId);
            }, 1000);
          });
        };
      });

      $scope.commentTime = function (dateObj) {
        dateObj = moment(dateObj, 'YYYYMMDD').fromNow();
        return dateObj;
      };

      $scope.isDisabled = true;
      $(document).ready(function () {
        var commentArea = $('.comment-area');
        var submitComment = $('.submit-comment');

        commentArea.on('click', function () {
          $('.comment-btn').css('display', 'flex');
          // submitComment.setEnabled(false);
        });

        commentArea.keydown(function () {
          var count = commentArea.val().length;
          if (count > 0) {
            $scope.isDisabled = false;
            submitComment.css('opacity', '1');
          } else {
            $scope.isDisabled = true;
            submitComment.css('opacity', '.3');
          }
        });

        $('.cancel-comment').on('click', function () {
          $('.comment-btn').css('display', 'none');
        });
      });

      //end of controller
    }
  };
});
'use strict';

angular.module('you-tube-clone').directive('footerDir', function () {
  return {
    restrict: 'E',
    templateUrl: './app/directives/footerDir/footerDir.html',
    controller: function controller($scope, mainService) {

      // This is an example to link two arrays into a single object to be ng-repeated

      // var exampleArray = [1,2,3,4,5,6,7,8,9,10];
      // var exampleArray2 = [11,12,13,14,15,16,17,18,19,20];
      //
      // $scope.coupledData = exampleArray.map(function(value, index){
      //   return {
      //     data: value,
      //     value: exampleArray2[index]
      //   }
      // });

    }
  };
});
'use strict';

angular.module('you-tube-clone').directive('hTrendingDir', function () {

    return {
        restrict: 'E',
        templateUrl: './app/directives/h-trendingDir/h-trendingDir.html',
        controller: function controller($scope, mainService) {
            $scope.counter = 0;
            $scope.hover = false;

            var getTrendingHome = function getTrendingHome() {
                mainService.getTrending().then(function (response) {
                    $scope.trendingVideos = response;
                    console.log('trending vids');
                    console.log($scope.trendingVideos);
                });
            };
            getTrendingHome();

            // NOTE: This converts the time for the video duration
            $scope.passVideo = function (video) {
                mainService.passVideo(video);
            };
            $scope.publishConverter = function (published) {
                published = moment(published, "YYYYMMDD").fromNow();
                return published;
            };
            $scope.channel = function (id) {
                console.log(id);
            };

            // NOTE: jQuery trending carousel
            $(document).ready(function () {
                // NOTE: to move slide 1 place = 427 (muliply number of slides you want to move by 427)
                $('.right-arrow-container').on('click', function () {
                    $('.carousel-wrapper').animate({
                        "left": "-=2090"
                    }, 500);
                });
                $('.left-arrow-container').on('click', function () {
                    $('.carousel-wrapper').animate({
                        "left": "+=2090"
                    }, 500);
                });
                $('#rcounter').on('click', function (e) {
                    $scope.counter++;
                    if ($scope.counter >= 2) {
                        $(e.currentTarget).css('visibility', 'hidden');
                        $(e.currentTarget.offsetParent.children[1]).css('visibility', 'visible');
                    }
                });
                $('#lcounter').on('click', function (e) {
                    $scope.counter--;
                    if ($scope.counter <= 0) {
                        $(e.currentTarget).css('visibility', 'hidden');
                        $(e.currentTarget.nextElementSibling).css('visibility', 'visible');
                    }
                });
                // NOTE: sub-nav hover effect
                $('.h-trending').mouseenter(function (e) {
                    $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
                    $(e.currentTarget).mouseleave(function (event) {
                        $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
                    });
                });

                $('.h-subscriptions').mouseenter(function (e) {
                    $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
                    $(e.currentTarget).mouseleave(function (e) {
                        $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
                    });
                });
            }); //<-- end of jQuery
        } //<-- end of controller
    };
});
//restrict with A,E, or AE
'use strict';

angular.module('you-tube-clone').directive('playList', function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: './app/directives/landingPlaylistDir/landingPlaylistDir.html',
    scope: {
      hplaylist: "="
    },
    controller: function controller($scope, mainService) {
      // NOTE: counter is for the carousel right and left logic
      $scope.counter = 0;

      $scope.$watch('hplaylist', function () {
        // holds the playlist ID
        $scope.homePlaylistInfo = $scope.hplaylist;
        var hplaylist = $scope.hplaylist.id;

        if (hplaylist) {
          $scope.getHomePlaylist = function (hplaylist) {
            mainService.getHomePlaylist(hplaylist).then(function (response) {
              // console.log(response.items);
              $scope.homePlaylistObj = response.items;
              // ==== Create empty array to hold stats of all videos in playlist ====
              $scope.videoStatsArr = [];
              for (var i = 0; i < $scope.homePlaylistObj.length; i++) {
                var vidId = $scope.homePlaylistObj[i].snippet.resourceId.videoId;

                $scope.getVideoInfo = function (vidId) {
                  // ==== call the service to get statistics for each video in the playlist ====
                  mainService.getVideoInfo(vidId).then(function (response) {

                    console.log('controller getVideoInfo response', response.items);
                    $scope.videoInfo = response.items[0];
                    // ==== If the id of video info matches the ID of the video in the playlist, push all info to videoStatsArr ====
                    if ($scope.videoInfo.id == vidId) {
                      $scope.videoStatsArr.push($scope.videoInfo);
                    }
                  });
                };
                $scope.getVideoInfo(vidId);
              }
            });
          };
        }
        $scope.getHomePlaylist(hplaylist);
      });

      // $scope.convertTime = (time) => {
      //   time = time.split(/[HMS]/);
      //   time[0] = time[0].split('');
      //   time[0].splice(0, 2);
      //   time[0] = time[0].join('');
      //   time.splice(time.length - 1, 1);
      //   var i = time.length - 1;
      //   if (time[i].length < 2) {
      //     time[i] = '0' + time[i]
      //   }
      //   time = time.join(':')
      //   if (time.length === 2) {
      //     time = '0:' + time
      //   }
      //   return time;
      // }
      $scope.publishConverter = function (published) {
        published = moment(published, "YYYYMMDD").fromNow();
        return published;
      };

      // NOTE: start of jQuery for carousel functionality
      $(document).ready(function () {
        $('.h-right-arrow-container').on('click', function (e) {
          var selection = $(this).parent().parent()[0].lastElementChild.children[0];
          $(selection).animate({
            "right": "+=1044"
          }, {
            duration: 400,
            step: function step(now, fx) {
              if (now === fx.end) {
                $(this).stop(true, false);
              }
            },
            start: function start(now) {
              if (now.tweens[0].now > -2500) {
                $(this).stop(true, false);
              }
            }
          });

          $scope.counter++;
          if ($scope.counter >= 1) {
            $(e.currentTarget).css('visibility', 'hidden');
            $(e.currentTarget.offsetParent.children[1]).css('visibility', 'visible');
          }
        });

        $('.h-left-arrow-container').on('click', function (e) {
          var selection = $(this).parent().parent()[0].lastElementChild.children[0];
          $(selection).animate({
            "right": "-=1044"
          }, {
            duration: 400,
            step: function step(now, fx) {
              if (now === fx.end) {
                $(this).stop(true, false);
              }
            },
            start: function start(now, fx) {
              if (now < -2500) {
                $(this).stop(true, false);
              }
            }
          });
          $scope.counter--;
          if ($scope.counter <= 0) {
            $(e.currentTarget).css('visibility', 'hidden');
            $(e.currentTarget.nextElementSibling).css('visibility', 'visible');
          }
        });
      }); // <-- end of jQuery
    } // <-- end of controller
  };
});
//restrict with A,E, or AE
'use strict';

angular.module('you-tube-clone').directive('playlistDir', function () {
  return {
    restrict: "E",
    templateUrl: './app/directives/playlistDir/playlistDir.html',
    controller: function controller($scope, mainService, $state) {
      $scope.topVidHover = false;
      $scope.thumbnailHover = false;
      $scope.showVideoOptions = false;
      $scope.underlineTitle = false;
      $scope.underlineChannel = false;

      $scope.getCurrentUser = function () {
        mainService.getCurrentUser().then(function (response) {
          console.log('User on session (playlistDir)?: ');
          console.log(response);
          $scope.currentUser = response.data;
          var userInfo = $scope.currentUser;
          mainService.getCurrentUserPlaylist(userInfo).then(function (response) {
            console.log("playlist array for user", response);
            $scope.userPlaylistVideos = response;
          });
        }).catch(function (err) {
          $scope.currentUser = null;
        });
      };
      $scope.getCurrentUser();

      $scope.removeVideo = function (id) {
        mainService.removeVideo(id).then(function (response) {
          if (response === 'deleted') {
            $state.go($state.current, {}, { reload: true });
          }
        });
      };

      // $scope.getCurrentUserPlaylist = () => {
      //   var userInfo = $scope.currentUser;
      //   mainService.getCurrentUserPlaylist(userInfo).then((response) => {
      //     alert('im getting a response')
      //   })
      // }


      //END OF CONTROLLER
    }
  };
});
'use strict';

angular.module('you-tube-clone').directive('playlistInfoDir', function () {
  return {
    restrict: 'E',
    templateUrl: './app/directives/playlistInfoDir/playlistInfoDir.html',
    scope: {
      playlistId: '=',
      thepic: "="
    },
    controller: function controller($scope, mainService) {
      $scope.$watch('playlistId', function () {
        // holds the playlist ID
        var playlistId = $scope.playlistId;

        if (playlistId) {
          $scope.getPlaylistInfo = function (playlistId) {
            mainService.getPlaylistInfo(playlistId).then(function (response) {
              $scope.playlistData = response.items;
            });
          };
        }
        $scope.getPlaylistInfo(playlistId);
      });
    }
  };
});
'use strict';

angular.module('you-tube-clone').directive('searchBarDir', function () {

  return {
    restrict: 'E',
    templateUrl: './app/directives/searchBarDir/searchBarDir.html',
    controller: function controller($scope, $state, $stateParams, mainService) {

      $scope.night = false;
      $scope.loggedIn = true;
      $scope.signOutModal = false;
      $scope.showModal = function () {
        $scope.signOutModal = false;
      };
      // $scope.signOut = function => {
      //
      // }
      $scope.getCurrentUser = function () {
        mainService.getCurrentUser().then(function (response) {
          console.log('User on session?');
          console.log(response);
          $scope.currentUser = response.data;
          $scope.loggedIn = true;
        }).catch(function (err) {
          $scope.currentUser = null;
          $scope.loggedIn = false;
        });
      };
      $scope.getCurrentUser();

      $scope.searchTerm = $stateParams.search_query;
      $scope.hamSlider = false;
      $scope.searchRequest = function (searchTerm) {
        // mainService.getSearchResults(searchTerm)
        // .then((response) => {
        //   $scope.searchResults = response;
        //   // console.log($scope.searchResults);
        // })
        $state.go('searchResults', { search_query: searchTerm });
      };

      $scope.openHamSlide = function () {
        if (!$scope.hamSlider) {
          $scope.hamSlider = true;

          $('.ham-bar-slide-outer-container').fadeIn(500);
          $('.home-view-main-wrapper, video-player-main-container').animate({ marginLeft: '68px' }, 500);
          $('.video-player-main-container').animate({ marginLeft: '100px' }, 500);
        } else {
          $scope.hamSlider = false;
          $('.ham-bar-slide-outer-container').fadeOut(500, function () {});
          $('.home-view-main-wrapper, .video-player-main-container').animate({ marginLeft: '0px' }, 500);
          $('.video-player-main-container').animate({ left: '' }, 500);
        };
      };

      $(document).ready(function () {

        $('.ham-icon').hover(function () {
          $(this).css({ "height": "16px", "width": "16px", "background": "no-repeat url('../images/you-tube-icons.webp') -469px -74px", "background-size": "auto" });
        }, function () {
          $(this).css({ "height": "16px", "width": "16px", "background": "no-repeat url('../images/you-tube-icons.webp') -696px -258px", "background-size": "auto" });
        });

        $('.night-mode-container').on('click', function (e) {
          $scope.night = !$scope.night;

          if ($scope.night === true) {
            $('.home-view-main-wrapper').animate({ backgroundColor: "#101010" }, 1000);
            $('.trending-video-wrapper, .h-nav-container, .search-bar-dir-outer-container, .h-trending-video-wrapper').animate({ backgroundColor: '#1E1E1E' }, 1000);
            $('.trending-video-title, .h-trending-video-title').animate({ color: 'rgb(103, 131, 171)' }, 1000);
            $('.trending-channel-title, .trending-view-count, .dot-style, .trending-publish').animate({ color: '#909090' }, 1000);
            $('.search-input').animate({ backgroundColor: '#3E3E3E' }, 1000);
            $('.search-btn, .night-mode-container, .upload-btn, .signin-btn').animate({ backgroundColor: '#343434' }, 1000);
            $('.night-mode-container').animate({ border: '1px solid #343434' }, 1000);
            $('.night-mode-container').animate({ color: 'rgba(255, 255, 0, 0.58)' }, 1000);
            $('.upload-btn, .signin-btn, .right-arrow-container, .h-right').animate({ color: '#B0B0B0' }, 1000);
            $('.search-icon').animate({ color: '#767676' }, 1000);
            $('.search-bar-dir-outer-container, .h-nav-container, .trending-video-wrapper, .h-trending-video-wrapper, .search-input, .search-btn, .upload-btn').css("border", "1px solid #3E3E3E").animate({}, 1000);
            $('.search-input').css("boxShadow", 'inset 0 0px 0px').animate({}, 1000);
            $('.h-home, .trending-title, .channel-title').animate({ color: '#979797' }, 1000);
            $('.right-arrow-container, .h-right-arrow-container').animate({ color: '#B0B0B0' }, 1000);
            $('.right-arrow-container, .left-arrow-container, .h-left-arrow-container, .h-right-arrow-container').animate({ backgroundColor: '#1e1e1e' }, 1000);
            $(e.currentTarget).mouseenter(function (e) {
              $(e.currentTarget).animate({ color: '#ccc' }, 500);
              $(e.currentTarget).animate({ backgroundColor: '#f8f8f8' }, 500);
              $(e.currentTarget).animate({ border: '1px solid #ccc' }, 500);
            });
            $('.night-mode-container').mouseleave(function (e) {
              $(e.currentTarget).animate({ backgroundColor: '#343434' }, 500);
              $(e.currentTarget).css('border', '1px solid #343434').animate({}, 500);
              $(e.currentTarget).animate({ color: 'rgba(255, 255, 0, 0.58)' }, 500);
            });
            $('.right-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
            });
            $('.right-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
            });
            $('.h-right-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
            });
            $('.h-right-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
            });
            $('.left-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
            });
            $('.left-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
            });
            $('.h-left-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
            });
            $('.h-left-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
            });
          } else if ($scope.night === false) {
            $('.right-arrow-container, .left-arrow-container').removeAttr('style');
            $('.home-view-main-wrapper').animate({ backgroundColor: '#f1f1f1' }, 1000);
            $('.trending-video-wrapper, .h-nav-container, .search-bar-dir-outer-container, .h-trending-video-wrapper').animate({ backgroundColor: '#fff' }, 1000);
            $('.trending-title, .channel-title').animate({ color: '#333333' }, 1000);
            $('.trending-video-title, .h-trending-video-title').animate({ color: 'rgb(22, 122, 198)' }, 1000);
            $('.trending-channel-title, .trending-view-count, .dot-style, .trending-publish').animate({ color: '#767676' }, 1000);
            $('.search-input').animate({ backgroundColor: '#fff' }, 1000);
            $('.search-btn, .night-mode-container, .upload-btn').animate({ backgroundColor: '#f8f8f8' }, 1000);
            $('.signin-btn').animate({ backgroundColor: '#167AC6' }, 1000);
            $('.signin-btn').animate({ color: '#fff' }, 1000);
            $('.search-bar-dir-outer-container, .h-nav-container, .search-input, .search-btn, .upload-btn, .night-mode-container').css('border', '1px solid #C8C8C8');
            $('.trending-video-wrapper, .h-trending-video-wrapper').css({ "border": "", "border-bottom": "1px solid #C8C8C8" });
            $('.h-home').animate({ color: '#000' }, 1000);
            $('.right-arrow-container, .left-arrow-container, .h-left-arrow-container, .h-right-arrow-container').css('background', '#fff');
            $('.night-mode-container').mouseenter(function (e) {
              $(e.currentTarget).animate({ backgroundColor: '#343434' }, 500);
              $(e.currentTarget).css('border', '1px solid #343434');
              $(e.currentTarget).animate({ color: 'rgba(255, 255, 0, 0.58)' }, 500);
            });

            $(e.currentTarget).mouseleave(function (e) {
              $(e.currentTarget).animate({ color: '#ccc' }, 500);
              $(e.currentTarget).animate({ backgroundColor: '#f8f8f8' }, 500);
              $(e.currentTarget).css('border', '1px solid #ccc');
            });
            $('.right-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#000",
                "background": "#fff",
                "box-shadow": "1px 0px 1.5px 1px #C8C8C8"
              });
            });
            $('.right-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#C8C8C8",
                "background": "#fff",
                "box-shadow": ""
              });
            });
            $('.h-right-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#fff",
                "box-shadow": "1px 0px 1.5px 1px #C8C8C8"
              });
            });
            $('.h-right-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "",
                "box-shadow": ""
              });
            });
            $('.left-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#000",
                "background": "#fff",
                "box-shadow": "-1px 0px 1.5px 1px #C8C8C8"
              });
            });
            $('.left-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#C8C8C8",
                "background": "#fff",
                "box-shadow": ""
              });
            });
            $('.h-left-arrow-container').mouseenter(function (event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#fff",
                "box-shadow": "-1px 0px 1.5px 1px #C8C8C8"
              });
            });
            $('.h-left-arrow-container').mouseleave(function (event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#fff",
                "box-shadow": ""
              });
            });
          }
        });
      }); //<--END OF jQuery
      //END OF CONTROLLER
    }
    //END OF RETURN OBJECT
  };
  //END OF DIRECTIVE
});
'use strict';

angular.module('you-tube-clone').directive('searchResultsDir', function () {

  return {
    restrict: 'E',
    templateUrl: './app/directives/searchResultsDir/searchResultsDir.html',
    scope: {
      searchResults: '='
    },
    controller: function controller($scope, $state, $timeout, mainService, $stateParams) {

      $scope.channelHover = false;

      $scope.convertTime = function (time) {
        time = moment(time, "YYYYMMDD").fromNow();
        return time;
      };

      $scope.roundSubs = function (displaySubs) {
        var newNum;
        if (displaySubs > 1000000) {
          newNum = Math.floor(displaySubs / 1000000) + "M";
          // console.log(newNum);
          return newNum;
        } else if (displaySubs > 1000 && displaySubs < 1000000) {
          newNum = Math.floor(displaySubs / 1000) + "K";
          // console.log(newNum);
          return newNum;
        } else {
          return displaySubs;
        }
      };

      $scope.showChannelHover = function (id) {
        $scope.hovering = true;
        if (!id) {
          return false;
        } else {
          mainService.getChannelHoverInfo(id).then(function (response) {
            // console.log(response);
            response.statistics.subscriberCount = $scope.roundSubs(response.statistics.subscriberCount);
            $scope.channelInfo = response;
          });

          var x = event.pageX;
          var y = event.pageY;
          // console.log(x,y);
          $scope.hoverPosition = {
            "top": y + "px",
            "left": x + "px"
          };
          $timeout(function () {
            if ($scope.hovering === true) {
              $scope.channelHover = true;
            }
          }, 1000);
        }
      };

      $scope.keepHovering = function () {
        $scope.hovering = true;
        $scope.channelHover = true;
      };

      $scope.hideChannelHover = function () {
        $scope.hovering = false;
        $scope.channelHover = false;
      };

      $scope.goToState = function (video, channel) {
        console.log("channel Id: ", channel);
        console.log("video Id: ", video);
        if (channel) {
          $state.go('channel', { channelId: channel });
        } else {
          $state.go('video', { videoId: video });
        }
      };

      //END OF CONTROLLER
    }
    //END OF RETURN (DIRECTIVE)
  };
});
'use strict';

// sideBarVideosDir


angular.module('you-tube-clone').directive('sideBarVideosDir', function () {

  return {
    restrict: 'E',
    templateUrl: './app/directives/side-bar-videos/side-bar-videos.html',
    controller: function controller($scope, mainService, $timeout) {

      $scope.loadCount = 0;
      $scope.channelHover = false;

      $scope.convertTime = function (time) {
        time = moment(time, "YYYYMMDD").fromNow();
        return time;
      };

      $scope.roundSubs = function (displaySubs) {
        var newNum;
        if (displaySubs > 1000000) {
          newNum = Math.floor(displaySubs / 1000000) + "M";
          // console.log(newNum);
          return newNum;
        } else if (displaySubs > 1000 && displaySubs < 1000000) {
          newNum = Math.floor(displaySubs / 1000) + "K";
          // console.log(newNum);
          return newNum;
        } else {
          return displaySubs;
        }
      };

      $scope.showChannelHover = function (id) {

        console.log(id);
        $scope.hovering = true;
        if (!id) {
          return false;
        } else {
          mainService.getChannelHoverInfo(id).then(function (response) {
            // console.log(response);
            response.statistics.subscriberCount = $scope.roundSubs(response.statistics.subscriberCount);
            $scope.channelInfo = response;
          });

          var x = event.pageX;
          var y = event.pageY;
          // console.log(x,y);
          $scope.hoverPosition = {
            "top": y + "px",
            "left": x + "px"
          };
          $timeout(function () {
            if ($scope.hovering === true) {
              $scope.channelHover = true;
            }
          }, 1000);
        }
      };

      $scope.keepHovering = function () {
        $scope.hovering = true;
        $scope.channelHover = true;
      };

      $scope.hideChannelHover = function () {
        $scope.hovering = false;
        $scope.channelHover = false;
      };

      var getTrendingData = function getTrendingData() {
        mainService.getTrending().then(function (response) {
          // var temp = response.items;


          $scope.trendingData = response.items;
          console.log('hello from the sideBarVideosDir!', $scope.trendingData);
        });
      };
      getTrendingData();

      $(document).ready(function () {
        $('.load-more-container').on('click', function (e) {
          $scope.loadCount++;
          if ($scope.loadCount <= 4) {
            $(this).animate({ top: '+=80.5vh' }, 1900);
            $('.side-bar-videos').animate({ height: '+=80.5vh' }, 2000);
          } else if ($scope.loadCount === 4) {
            $('.load-more-container').css('background', 'red');
          }
        });
      });

      //END OF CONTROLLER
    }
    //END OF RETURN (DIRECTIVE)
  };
});
'use strict';

angular.module('you-tube-clone').directive('trendingViewDir', function () {

  return {
    restrict: 'EC',
    templateUrl: './app/directives/trendingView/trendingViewDir.html',
    // link: function(scope, element, attrs) {
    //   $(document).ready(function() {
    //     $('.thumbnail').hover(function() {
    //       $('.thumbnail').css({
    //         "width": "10px"
    //       })
    //     })
    //   })
    // },
    controller: function controller($scope, mainService, $timeout, authService) {

      // ChannelHover material


      var getTrendingData = function getTrendingData() {
        mainService.getTrending().then(function (response) {
          $scope.trendingData = response.items;
          // console.log($scope.trendingData);
        });
      };
      getTrendingData();

      $scope.passVideo = function (video) {
        mainService.passVideo(video);
      };
      $scope.videoTime = function (dateObj) {
        dateObj = moment(dateObj, 'YYYYMMDD').fromNow();
        return dateObj;
      };

      $scope.checkmark = true;
      $scope.check = function () {
        if ($scope.currentUser !== null) {
          return true;
        } else {
          return false;
        }
      };
      $scope.hover = true;
      $scope.hidden = false;
      $scope.watchLaterPopup = true;
      $scope.signInPopup = false;
      $scope.signIn = function () {
        if (!$scope.currentUser) {
          return true;
        } else {
          return false;
        }
      };

      $scope.modal = true;
      $scope.addToPlaylist = function (video) {
        var currentUser = $scope.currentUser;
        if (!$scope.currentUser) {
          console.log('no user on session');
          $scope.modal = false;
          return;
        }

        console.log("watch later vid", video);
        mainService.addToPlaylist(video, currentUser);
      };

      $scope.getCurrentUser = function () {
        mainService.getCurrentUser().then(function (response) {
          console.log('User on session?');
          console.log(response);
          $scope.currentUser = response.data;
        }).catch(function (err) {
          $scope.currentUser = null;
        });
      };
      $scope.getCurrentUser();

      // $scope.register = (user) => {
      //   console.log('controller user: ', user);
      //   authService.registerUser(user).then((response) => {
      //     if (!response.data) {
      //       alert('unable to create user');
      //     } else {
      //       alert('user created');
      //       console.log('user that was created and put on current user:', response.data);
      //       $scope.currentUser = response.data;
      //       $scope.modal = true;
      //       $scope.newUser = {};
      //     }
      //   }).catch((err) => {
      //     alert('unable to create user');
      //   });
      // };
      //
      // $scope.login = (user) => {
      //   authService.login(user).then((response) => {
      //     console.log(response.data);
      //     $scope.currentUser = response.data;
      //     if (!response.data) {
      //       alert('User cannot be found.');
      //       $scope.user.password = '';
      //     } else {
      //       $scope.addToCart($scope.pencil);
      //     }
      //   }).catch((err) => {
      //     alert('Username and password do not match.')
      //   })
      // }

      $(document).ready(function (e) {

        $('.home').mouseenter(function (e) {
          $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
          $(e.currentTarget).mouseleave(function (event) {
            $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
          });
        });

        $('.subscriptions').mouseenter(function (e) {
          $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
          $(e.currentTarget).mouseleave(function (e) {
            $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
          });
        });
      });

      //END OF CONTROLLER
    }
    //END OF RETURN (DIRECTIVE)
  };
});
'use strict';

angular.module('you-tube-clone').directive('videoPlayer', function () {

  return {
    restrict: 'E',
    templateUrl: './app/directives/videoPlayerDir/videoPlayerDir.html',
    controller: function controller($scope, mainService, $interval, $stateParams, $sce) {
      $scope.shareOn = false;
      $scope.nightMode = false;
      //function for changing current video in service
      $scope.changeVideo = function (video) {
        mainService.newVideo = video;
      };

      var vidData = mainService.getTrending().then(function (response) {
        $scope.rawData = response;
      });

      $scope.singleVid = mainService.singleVid[0];

      var id = $stateParams.videoId;

      //get the video data for the clicked video
      $scope.getVideoInfo = function (id) {
        mainService.getVideoInfo(id).then(function (response) {
          $scope.videoInfo = response;

          $scope.videoId = response.items[0].id;
          $scope.videoUrl = "https://www.youtube.com/embed/" + $scope.videoId + "?autoplay=1&origin=http://example.com";
          $scope.thisUrl = $sce.trustAsResourceUrl($scope.videoUrl);

          // this specific variable holds the video info (ie title, and statistics)
          $scope.videoData = response.items[0];
          var reactionSum = $scope.videoData.statistics.likeCount * 1 + $scope.videoData.statistics.dislikeCount * 1;
          $scope.description = $scope.videoData.snippet.description;

          // get percent to adjust bar to show like/dislike ratio
          var percent = $scope.videoData.statistics.likeCount / reactionSum * 100;
          $('.myBar').css('width', percent + '%');

          var channelId = $scope.videoData.snippet.channelId;
          $scope.getChannelInfoOnVidPlayer = function (channelId) {
            mainService.getChannelInfoOnVidPlayer(channelId).then(function (response) {
              $scope.channelInfo = response;

              $scope.channelData = response.items[0];
            });
          };
          $scope.getChannelInfoOnVidPlayer(channelId);
        });
      };
      $scope.getVideoInfo(id);
      $('.share-tab').on("click", function () {
        $(this).toggleClass('share-tab-border');
      });

      $(document).ready(function (e) {
        $('#share-button').on("click", function (e) {

          $(this).css({
            borderBottom: '2px solid #CC181E',
            color: '#000'
          });
          $('#embed-button').css('border-bottom', '0 solid #fff');
          $('#email-button').css('border-bottom', '0 solid #fff');
        });

        $('#embed-button').on("click", function (e) {
          $(this).css({
            borderBottom: '2px solid #CC181E',
            color: '#000'
          });
          $('#share-button').css('border-bottom', '0 solid #fff');
          $('#email-button').css('border-bottom', '0 solid #fff');
        });

        $('#email-button').on("click", function (e) {
          $(this).css({
            borderBottom: '2px solid #CC181E',
            color: '#000'
          });
          $('#embed-button').css('border-bottom', '0 solid #fff');
          $('#share-button').css('border-bottom', '0 solid #fff');
        });

        $('.night-mode-container').on('click', function (e) {
          $scope.nightMode = !$scope.nightMode;
          console.log($scope.nightMode);

          if ($scope.nightMode === true) {
            $('.video-player-container').animate({ backgroundColor: 'rgb(15, 15, 15)' }, 1000);
            $('.video-title-container, .side-bar-videos-dir-container, .main-description-wrapper, .comments-dir-main-container, .side-bar-videos').animate({ backgroundColor: 'rgb(30, 30, 30)' }, 1000);
            $('.video-title').animate({ color: '#898989' }, 1000);
            $('.view-count, .main-description-wrapper, .title').animate({ color: '#909090' }, 1000);
            $('.subscription-count').animate({ backgroundColor: 'rgb(85, 85, 85)', color: '#bbb' }, 1000);
            $('.subscription-count').css('border', '1px solid rgb(85, 85, 85)');
            $('.video-description a, .name-wrap, .name, .author-name').animate({ color: '#6783ab' }, 1000);
            $('.small-text, .small-view-text, .orig-comment, .reply, .reply-comment-wrap, .ot-anchor').animate({ color: '#646464' }, 1000);
            $('.video-description, .author-info-container').css('border-bottom', '1px solid rgb(85, 85, 85)');
            $('.proflink').animate({ color: '#128EE9' }, 1000);
            $('.title').hover(function () {
              $(this).css('color', '#6783ab');
            }, function () {
              $(this).css('color', '#909090');
            });
          } else if ($scope.nightMode === false) {
            $('.video-player-container').removeAttr('style');
            $('.video-title-container, .side-bar-videos-dir-container, .main-description-wrapper, .comments-dir-main-container, .side-bar-videos').removeAttr('style');
            $('.video-title').removeAttr('style');
            $('.view-count, .main-description-wrapper, .title').removeAttr('style');
            $('.subscription-count').removeAttr('style');
            $('.subscription-count').css('border-bottom', '#f1f1f1');
            $('.video-description a, .name-wrap, .name, .author-name').removeAttr('style');
            $('.small-text, .small-view-text, .orig-comment, .reply, .reply-comment-wrap, .ot-anchor').removeAttr('style');
            $('.video-description, .author-info-container').css('border-bottom', '1px solid rgb(85, 85, 85)');
            $('.proflink').removeAttr('style');
          }
        });
      });
    }
  };
});