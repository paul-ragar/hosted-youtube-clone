angular.module('you-tube-clone')
  .directive('playList', () => {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: './app/directives/landingPlaylistDir/landingPlaylistDir.html',
      scope: {
        hplaylist: "="
      },
      controller: ($scope, mainService) => {
// NOTE: counter is for the carousel right and left logic
        $scope.counter = 0;

        $scope.$watch('hplaylist', () => {
          // holds the playlist ID
          $scope.homePlaylistInfo = $scope.hplaylist
          var hplaylist = $scope.hplaylist.id;

          if (hplaylist) {
            $scope.getHomePlaylist = (hplaylist) => {
              mainService.getHomePlaylist(hplaylist).then((response) => {
                // console.log(response.items);
                $scope.homePlaylistObj = response.items;
                // ==== Create empty array to hold stats of all videos in playlist ====
                $scope.videoStatsArr = [];
                for (var i = 0; i < $scope.homePlaylistObj.length; i++) {
                  const vidId = $scope.homePlaylistObj[i].snippet.resourceId.videoId;

                  $scope.getVideoInfo = (vidId) => {
                    // ==== call the service to get statistics for each video in the playlist ====
                    mainService.getVideoInfo(vidId).then((response) => {

                      // console.log('controller getVideoInfo response', response.items);
                      $scope.videoInfo = response.items[0];
                      // ==== If the id of video info matches the ID of the video in the playlist, push all info to videoStatsArr ====
                      if ($scope.videoInfo.id == vidId) {
                        $scope.videoStatsArr.push($scope.videoInfo);
                      }
                    })
                  }
                  $scope.getVideoInfo(vidId)
                }
              })
            }
          }
          $scope.getHomePlaylist(hplaylist);
        })

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
            $scope.publishConverter = (published) => {
              published = moment(published, "YYYYMMDD").fromNow();
              return published;
            };

            // NOTE: start of jQuery for carousel functionality
            $(document).ready(function(){
              $('.h-right-arrow-container').on('click', function(e) {
                var selection = $(this).parent().parent()[0].lastElementChild.children[0];
                $(selection).animate({
                  "right": "+=1044"
                }, {
                  duration: 400,
                  step: function(now, fx) {
                    if (now === fx.end) {
                      $(this).stop(true, false);
                    }
                  },
                  start: function(now) {
                    if (now.tweens[0].now > -2500) {
                      $(this).stop(true, false);
                    }
                  }
                });

                $scope.counter++;
                if ($scope.counter >= 1 ){
                  $(e.currentTarget).css('visibility', 'hidden');
                  $(e.currentTarget.offsetParent.children[1]).css('visibility', 'visible');
                }
              });

              $('.h-left-arrow-container').on('click', function(e) {
                var selection = $(this).parent().parent()[0].lastElementChild.children[0];
                $(selection).animate({
                  "right": "-=1044"
                }, {
                  duration: 400,
                  step: function(now, fx) {
                    if (now === fx.end) {
                      $(this).stop(true, false);
                    }
                  },
                  start: function(now, fx) {
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
              })
            }) // <-- end of jQuery

      } // <-- end of controller
    }
  });
    //restrict with A,E, or AE
