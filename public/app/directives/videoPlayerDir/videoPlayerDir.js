angular.module('you-tube-clone')
.directive('videoPlayer', () => {

  return {
    restrict: 'E',
    templateUrl: './app/directives/videoPlayerDir/videoPlayerDir.html',
    controller: ($scope, mainService, $interval, $stateParams, $sce) => {
      $scope.shareOn = false;
      $scope.nightMode = false;
    //function for changing current video in service
    $scope.changeVideo = (video) => {
      mainService.newVideo = video;
    }

      const vidData = mainService.getTrending()
      .then((response) => {
        $scope.rawData = response;
      })


      $scope.singleVid = mainService.singleVid[0];

      const id = $stateParams.videoId;

      //get the video data for the clicked video
      $scope.getVideoInfo = function(id){
        mainService.getVideoInfo(id).then((response) => {
          $scope.videoInfo = response;

          $scope.videoId = response.items[0].id;
          $scope.videoUrl = "https://www.youtube.com/embed/" + $scope.videoId +
          "?autoplay=1&origin=http://example.com";
          $scope.thisUrl = $sce.trustAsResourceUrl($scope.videoUrl);

          // this specific variable holds the video info (ie title, and statistics)
          $scope.videoData = response.items[0];
          const reactionSum = ($scope.videoData.statistics.likeCount * 1) + ($scope.videoData.statistics.dislikeCount * 1);
          $scope.description = $scope.videoData.snippet.description;

          // get percent to adjust bar to show like/dislike ratio
          const percent = ($scope.videoData.statistics.likeCount / reactionSum) * 100;
          $('.myBar').css('width', percent + '%');

          var channelId = $scope.videoData.snippet.channelId;
          $scope.getChannelInfoOnVidPlayer = (channelId) => {
            mainService.getChannelInfoOnVidPlayer(channelId).then((response) => {
              $scope.channelInfo = response;

              $scope.channelData = response.items[0];
            })
          }
          $scope.getChannelInfoOnVidPlayer(channelId);
        })
      }
        $scope.getVideoInfo(id);
        $('.share-tab').on("click", function(){
          $(this).toggleClass('share-tab-border');
        });


        $(document).ready(function(e) {
            $('#share-button').on("click", function(e){

              $(this).css({
                borderBottom: '2px solid #CC181E',
                color: '#000'
              });
              $('#embed-button').css('border-bottom', '0 solid #fff');
              $('#email-button').css('border-bottom', '0 solid #fff');
            });

            $('#embed-button').on("click", function(e){
              $(this).css({
                borderBottom: '2px solid #CC181E',
                color: '#000'
              });
              $('#share-button').css('border-bottom', '0 solid #fff');
              $('#email-button').css('border-bottom', '0 solid #fff');
            });

            $('#email-button').on("click", function(e){
              $(this).css({
                borderBottom: '2px solid #CC181E',
                color: '#000'
              });
              $('#embed-button').css('border-bottom', '0 solid #fff');
              $('#share-button').css('border-bottom', '0 solid #fff');
            });



            $('.night-mode-container').on('click', function(e){
              $scope.nightMode = !$scope.nightMode;
              // console.log($scope.nightMode);

              if($scope.nightMode === true){
                $('.video-player-container').animate({backgroundColor: 'rgb(15, 15, 15)'}, 1000);
                $('.video-title-container, .side-bar-videos-dir-container, .main-description-wrapper, .comments-dir-main-container, .side-bar-videos').animate({backgroundColor: 'rgb(30, 30, 30)'}, 1000);
                $('.video-title').animate({color: '#898989'}, 1000);
                $('.view-count, .main-description-wrapper, .title').animate({color: '#909090'}, 1000);
                $('.subscription-count').animate({backgroundColor:'rgb(85, 85, 85)', color: '#bbb'}, 1000);
                $('.subscription-count').css('border', '1px solid rgb(85, 85, 85)');
                $('.video-description a, .name-wrap, .name, .author-name').animate({color: '#6783ab'}, 1000);
                $('.small-text, .small-view-text, .orig-comment, .reply, .reply-comment-wrap, .ot-anchor').animate({color: '#646464'}, 1000)
                $('.video-description, .author-info-container').css('border-bottom', '1px solid rgb(85, 85, 85)');
                $('.proflink').animate({color: '#128EE9'}, 1000)
                $('.title').hover(function() {
                  $(this).css('color', '#6783ab');
                }, function() {
                  $(this).css('color', '#909090');
                });
              } else if ($scope.nightMode === false){
                $('.video-player-container').removeAttr('style');
                $('.video-title-container, .side-bar-videos-dir-container, .main-description-wrapper, .comments-dir-main-container, .side-bar-videos').removeAttr('style');
                $('.video-title').removeAttr('style');
                $('.view-count, .main-description-wrapper, .title').removeAttr('style');
                $('.subscription-count').removeAttr('style');
                $('.subscription-count').css('border-bottom', '#f1f1f1');
                $('.video-description a, .name-wrap, .name, .author-name').removeAttr('style');
                $('.small-text, .small-view-text, .orig-comment, .reply, .reply-comment-wrap, .ot-anchor').removeAttr('style');
                $('.video-description, .author-info-container').css('border-bottom', '1px solid rgb(85, 85, 85)');
                $('.proflink').removeAttr('style')
              }
            })


        });

    }
  }






})
