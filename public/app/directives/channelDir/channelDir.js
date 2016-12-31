angular.module('you-tube-clone')
.directive('channelDir', () => {

  return {
    restrict: 'E',
    templateUrl: './app/directives/channelDir/channelDir.html',
    scope: {
      channelData: '='
    },
    controller: ($scope, $stateParams, $sce, $timeout, mainService) => {

      $scope.moreDescription = {
        "overflow": "hidden"
      }
      $scope.readMoreShowLess = "Read More";

      $scope.channelTrailerId = $scope.channelData.brandingSettings.channel.unsubscribedTrailer;

      $scope.videoUrl = "https://www.youtube.com/embed/" + $scope.channelTrailerId +
      "?autoplay=1&origin=http://example.com";

      $scope.channelTrailer = $sce.trustAsResourceUrl($scope.videoUrl);

      $scope.convertTime = (time) => {
        time = moment(time, "YYYYMMDD").fromNow();
        return time;
      };

      $scope.readMore = () => {
        if ($scope.readMoreShowLess === "Read More") {
          $scope.moreDescription = {
            "overflow": "none",
            "max-height": "none"
          }
          $scope.readMoreShowLess = "Show Less"
        } else {
          $scope.moreDescription = {
            "overflow": "hidden",
            "max-height": "12.2em"
          }
          $scope.readMoreShowLess = "Read More"
        }

      }











    //END OF CONTROLLER
    }
  //END OF RETURN (DIRECTIVE)
  }
})
