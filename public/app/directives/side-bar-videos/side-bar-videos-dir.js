// sideBarVideosDir


angular.module('you-tube-clone')
.directive('sideBarVideosDir', () => {

  return {
    restrict: 'E',
    templateUrl: './app/directives/side-bar-videos/side-bar-videos.html',
    controller: ($scope, mainService, $timeout) => {

      $scope.loadCount = 0;
      $scope.channelHover = false;

      $scope.convertTime = (time) => {
        time = moment(time, "YYYYMMDD").fromNow();
        return time;
      };

      $scope.roundSubs = function(displaySubs) {
        var newNum;
        if (displaySubs > 1000000) {
          newNum = Math.floor(displaySubs/1000000) + "M";
          // console.log(newNum);
          return newNum;
        } else if (displaySubs > 1000 && displaySubs < 1000000) {
          newNum = Math.floor(displaySubs/1000) + "K";
          // console.log(newNum);
          return newNum;
        } else {
          return displaySubs;
        }

      }

      $scope.showChannelHover = (id) => {

        // console.log(id);
        $scope.hovering = true;
        if (!id) {
          return false
        } else {
          mainService.getChannelHoverInfo(id)
          .then((response) => {
            // console.log(response);
            response.statistics.subscriberCount = $scope.roundSubs(response.statistics.subscriberCount);
            $scope.channelInfo = response;
          })

          var x = event.pageX;
          var y = event.pageY;
          // console.log(x,y);
          $scope.hoverPosition = {
            "top" : y + "px",
            "left" : x + "px",
          }
          $timeout(function () {
            if ($scope.hovering === true) {
              $scope.channelHover = true;
            }
          }, 1000);
        }
      }

      $scope.keepHovering = () => {
        $scope.hovering = true
        $scope.channelHover = true;
      }

      $scope.hideChannelHover = function() {
        $scope.hovering = false;
        $scope.channelHover = false;
      }


      const getTrendingData = () => {
        mainService.getTrending()
        .then((response) => {
          // var temp = response.items;



          $scope.trendingData = response.items;
          console.log('hello from the sideBarVideosDir!', $scope.trendingData);
        })
      };
      getTrendingData();


      $(document).ready(function() {
        $('.load-more-container').on('click', function(e) {
          $scope.loadCount++
          if ($scope.loadCount <= 4) {
            $(this).animate({top: '+=80.5vh'}, 1900)
              $('.side-bar-videos').animate({height: '+=80.5vh'}, 2000);
          } else if ($scope.loadCount === 4) {
            $('.load-more-container').css('background', 'red');
          }

        })
      });

    //END OF CONTROLLER
    }
  //END OF RETURN (DIRECTIVE)
  }
})
