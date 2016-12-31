angular.module('you-tube-clone')
.directive('searchBarDir', () => {

  return {
    restrict: 'E',
    templateUrl: './app/directives/searchBarDir/searchBarDir.html',
    controller: ($scope, $state, $stateParams, mainService) => {

      $scope.night = false;
      $scope.loggedIn = true;
      $scope.signOutModal = false;
      $scope.showModal = () => {
        $scope.signOutModal = false;
      }
      // $scope.signOut = function => {
      //
      // }
      $scope.getCurrentUser = () => {
        mainService.getCurrentUser().then((response) => {
          // console.log('User on session?');
          // console.log(response);
          $scope.currentUser = response.data;
          $scope.loggedIn = true;
        }).catch((err) => {
          $scope.currentUser = null;
          $scope.loggedIn = false;
        })
      }
      $scope.getCurrentUser();

      $scope.searchTerm = $stateParams.search_query;
      $scope.hamSlider = false;
      $scope.searchRequest = (searchTerm) => {
        // mainService.getSearchResults(searchTerm)
        // .then((response) => {
        //   $scope.searchResults = response;
        //   // console.log($scope.searchResults);
        // })
        $state.go('searchResults', {search_query: searchTerm});
      }

      $scope.openHamSlide = () => {
        if (!$scope.hamSlider) {
          $scope.hamSlider = true;

          $('.ham-bar-slide-outer-container').fadeIn(500);
          $('.home-view-main-wrapper, video-player-main-container').animate({marginLeft: '68px'}, 500);
          $('.video-player-main-container').animate({marginLeft: '100px'}, 500)
        } else {
          $scope.hamSlider = false;
          $('.ham-bar-slide-outer-container').fadeOut(500, function() {

          });
          $('.home-view-main-wrapper, .video-player-main-container').animate({marginLeft: '0px'}, 500);
          $('.video-player-main-container').animate({left: ''}, 500);
        };
      };


  $(document).ready(function(){

      $('.ham-icon').hover(function() {
        $(this).css({"height": "16px", "width": "16px", "background": "no-repeat url('../images/you-tube-icons.webp') -469px -74px", "background-size": "auto"});
      }, function() {
        $(this).css({"height": "16px", "width": "16px", "background": "no-repeat url('../images/you-tube-icons.webp') -696px -258px", "background-size": "auto"});
      });

      $('.night-mode-container').on('click', function(e){
        $scope.night = !$scope.night;

        if ($scope.night === true) {
          $('.home-view-main-wrapper').animate({backgroundColor: "#101010"}, 1000);
          $('.trending-video-wrapper, .h-nav-container, .search-bar-dir-outer-container, .h-trending-video-wrapper').animate({backgroundColor:'#1E1E1E'}, 1000);
          $('.trending-video-title, .h-trending-video-title').animate({color: 'rgb(103, 131, 171)'}, 1000);
          $('.trending-channel-title, .trending-view-count, .dot-style, .trending-publish').animate({color: '#909090'}, 1000);
          $('.search-input').animate({backgroundColor: '#3E3E3E'}, 1000);
          $('.search-btn, .night-mode-container, .upload-btn, .signin-btn').animate({backgroundColor: '#343434'}, 1000);
          $('.night-mode-container').animate({border: '1px solid #343434'}, 1000);
          $('.night-mode-container').animate({color: 'rgba(255, 255, 0, 0.58)'}, 1000);
          $('.upload-btn, .signin-btn, .right-arrow-container, .h-right').animate({color: '#B0B0B0'}, 1000);
          $('.search-icon').animate({color: '#767676'}, 1000);
          $('.search-bar-dir-outer-container, .h-nav-container, .trending-video-wrapper, .h-trending-video-wrapper, .search-input, .search-btn, .upload-btn').css("border", "1px solid #3E3E3E").animate({}, 1000);
          $('.search-input').css("boxShadow", 'inset 0 0px 0px').animate({}, 1000);
          $('.h-home, .trending-title, .channel-title').animate({color: '#979797'}, 1000);
          $('.right-arrow-container, .h-right-arrow-container').animate({color: '#B0B0B0'}, 1000);
          $('.right-arrow-container, .left-arrow-container, .h-left-arrow-container, .h-right-arrow-container').animate({backgroundColor: '#1e1e1e'}, 1000);
          $(e.currentTarget).mouseenter(function(e) {
            $(e.currentTarget).animate({color:'#ccc'}, 500);
            $(e.currentTarget).animate({backgroundColor: '#f8f8f8'}, 500);
            $(e.currentTarget).animate({border:'1px solid #ccc'}, 500);
          });
          $('.night-mode-container').mouseleave(function (e) {
            $(e.currentTarget).animate({backgroundColor: '#343434'}, 500);
            $(e.currentTarget).css('border', '1px solid #343434').animate({}, 500);
            $(e.currentTarget).animate({color: 'rgba(255, 255, 0, 0.58)'}, 500);
          });
          $('.right-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
          });
          $('.right-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
          });
          $('.h-right-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
          });
          $('.h-right-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
          });
          $('.left-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
          });
          $('.left-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
          });
          $('.h-left-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#343434",
                "box-shadow": "1px 0px 1.5px 1px #343434"
              });
          });
          $('.h-left-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#1E1E1E",
                "box-shadow": ""
              });
          });
          } else if ($scope.night === false) {
            $('.right-arrow-container, .left-arrow-container').removeAttr('style')
            $('.home-view-main-wrapper').animate({backgroundColor: '#f1f1f1'}, 1000);
            $('.trending-video-wrapper, .h-nav-container, .search-bar-dir-outer-container, .h-trending-video-wrapper').animate({backgroundColor:'#fff'}, 1000);
            $('.trending-title, .channel-title').animate({color: '#333333'}, 1000);
            $('.trending-video-title, .h-trending-video-title').animate({color:'rgb(22, 122, 198)'}, 1000);
            $('.trending-channel-title, .trending-view-count, .dot-style, .trending-publish').animate({color: '#767676'}, 1000);
            $('.search-input').animate({backgroundColor: '#fff'}, 1000);
            $('.search-btn, .night-mode-container, .upload-btn').animate({backgroundColor: '#f8f8f8'}, 1000);
            $('.signin-btn').animate({backgroundColor: '#167AC6'}, 1000);
            $('.signin-btn').animate({color: '#fff'}, 1000);
            $('.search-bar-dir-outer-container, .h-nav-container, .search-input, .search-btn, .upload-btn, .night-mode-container').css('border', '1px solid #C8C8C8');
            $('.trending-video-wrapper, .h-trending-video-wrapper').css({"border": "", "border-bottom": "1px solid #C8C8C8"});
            $('.h-home').animate({color:'#000'}, 1000);
            $('.right-arrow-container, .left-arrow-container, .h-left-arrow-container, .h-right-arrow-container').css('background', '#fff');
          $('.night-mode-container').mouseenter(function (e) {
            $(e.currentTarget).animate({backgroundColor: '#343434'}, 500);
            $(e.currentTarget).css('border', '1px solid #343434');
            $(e.currentTarget).animate({color:'rgba(255, 255, 0, 0.58)'}, 500);
          });

          $(e.currentTarget).mouseleave(function(e) {
            $(e.currentTarget).animate({color:'#ccc'}, 500);
            $(e.currentTarget).animate({backgroundColor:'#f8f8f8'}, 500);
            $(e.currentTarget).css('border','1px solid #ccc' );
          });
          $('.right-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#000",
                "background": "#fff",
                "box-shadow": "1px 0px 1.5px 1px #C8C8C8"
              });
          });
          $('.right-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#C8C8C8",
                "background": "#fff",
                "box-shadow": ""
              });
          });
          $('.h-right-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#fff",
                "box-shadow": "1px 0px 1.5px 1px #C8C8C8"
              });
          });
          $('.h-right-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "",
                "box-shadow": ""
              });
          });
          $('.left-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#000",
                "background": "#fff",
                "box-shadow": "-1px 0px 1.5px 1px #C8C8C8"
              });
          });
          $('.left-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#C8C8C8",
                "background": "#fff",
                "box-shadow": ""
              });
          });
          $('.h-left-arrow-container').mouseenter(function(event) {
              $(this).css({
                "color": "#6f6f6f",
                "background": "#fff",
                "box-shadow": "-1px 0px 1.5px 1px #C8C8C8"
              });
          });
          $('.h-left-arrow-container').mouseleave(function(event) {
              $(this).css({
                "color": "#B0B0B0",
                "background": "#fff",
                "box-shadow": ""
              });
          });
        }
      })
    }); //<--END OF jQuery
      //END OF CONTROLLER
    }
    //END OF RETURN OBJECT
  }
  //END OF DIRECTIVE
})
