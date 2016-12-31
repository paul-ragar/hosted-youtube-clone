angular.module('you-tube-clone', ['ui.router', 'ngSanitize', 'chieffancypants.loadingBar', 'ngAnimate', 'ui.sortable'])
.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  $stateProvider
  .state('landing', {
    url: '/',
    templateUrl: './app/views/homeView.html'
  })
  .state('trending', {
    url: '/trending',
    templateUrl: './app/views/trendingView.html'
  })
  .state('video', {
    url:"/watch/:videoId",
    templateUrl: './app/views/videoPlayer/videoPlayer.html'
  })
  .state('searchResults', {
    url:"/searchResults?search_query",
    templateUrl: './app/views/searchResults.html',
    resolve: {
      searchResults: function ($stateParams, mainService) {
        return mainService.getSearchResults($stateParams.search_query)
          .then((response) => {
            return response;
          });
      }
    },
    controller: function($scope, searchResults){
      $scope.searchResults = searchResults;
      // console.log("SearchResults RESULTS: ", searchResults);
    }
  })
  .state('auth', {
    url: '/sign-in',
    templateUrl: './app/views/signInView.html'
  })
  .state('playlist', {
    url: '/playlist',
    templateUrl: './app/views/playlist.html'
  })
  .state('channel', {
    url: '/channel/:channelId',
    templateUrl: './app/views/channel.html',
    resolve: {
      channelData: ($stateParams, mainService)=>{
        return mainService.getChannelData($stateParams.channelId).then(
          (response)=>{
            return response;
          }
        );
      }
    },
    controller: ($scope, channelData)=>{
      $scope.channelData = channelData;
      console.log("channelData RESULTS: ", channelData);
    }
  })

})
