angular.module('you-tube-clone')
  .directive('playlistInfoDir', () => {
    return {
      restrict:'E',
      templateUrl: './app/directives/playlistInfoDir/playlistInfoDir.html',
      scope: {
        playlistId: '=',
        thepic: "="
      } ,
      controller: ($scope, mainService) => {
        $scope.$watch('playlistId', () => {
          // holds the playlist ID
          var playlistId = $scope.playlistId;

          if(playlistId) {
            $scope.getPlaylistInfo = (playlistId) => {
              mainService.getPlaylistInfo(playlistId).then((response) => {
                $scope.playlistData = response.items;
              })
            }
          }
          $scope.getPlaylistInfo(playlistId);
        })
      }
    }
  })
