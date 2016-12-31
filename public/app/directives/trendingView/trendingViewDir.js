angular.module('you-tube-clone')
.directive('trendingViewDir', function() {

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
    controller: ($scope, mainService, $timeout, authService) => {

// ChannelHover material







      const getTrendingData = () => {
        mainService.getTrending()
        .then((response) => {
          $scope.trendingData = response.items;
          // console.log($scope.trendingData);
        })
      };
      getTrendingData();

      $scope.passVideo = (video) => {
        mainService.passVideo(video);
      }
      $scope.videoTime = (dateObj)=> {
        dateObj = moment(dateObj, 'YYYYMMDD').fromNow();
        return dateObj;
      }

      $scope.checkmark = true;
      $scope.check = () => {
        if($scope.currentUser !== null) {
          return true;
        } else {
          return false;
        }
      }
      $scope.hover = true;
      $scope.hidden = false;
      $scope.watchLaterPopup = true;
      $scope.signInPopup = false;
      $scope.signIn = () => {
        if (!$scope.currentUser) {
          return true;
        } else {
          return false;
        }
      }

      $scope.modal = true;
      $scope.addToPlaylist = (video) => {
        const currentUser = $scope.currentUser;
        if (!$scope.currentUser) {
          // console.log('no user on session');
          $scope.modal = false;
          return;
        }


        // console.log("watch later vid", video);
        mainService.addToPlaylist(video, currentUser);

      }

      $scope.getCurrentUser = () => {
        mainService.getCurrentUser().then((response) => {
          // console.log('User on session?');
          // console.log(response);
          $scope.currentUser = response.data;
        }).catch((err) => {
          $scope.currentUser = null;
        })
      }
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

    $(document).ready(function(e) {

      $('.home').mouseenter(function(e) {
          $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
          $(e.currentTarget).mouseleave(function(event) {
          $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
          });
      });

      $('.subscriptions').mouseenter(function(e) {
        $(e.currentTarget).css('border-bottom', 'solid #CC181E 3px');
        $(e.currentTarget).mouseleave(function(e) {
          $(e.currentTarget).css('border-bottom', 'solid #fff 0px');
        });
      });


    });


    //END OF CONTROLLER
  }
  //END OF RETURN (DIRECTIVE)
  }
})
