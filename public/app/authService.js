angular.module('you-tube-clone')
.service('authService', function ($http) {

  this.registerUser = (user) => {
    return $http({
      method: 'POST',
      url: '/register',
      data: user
    }).then((response) => {
      return response;
    });
  };

  this.getCurrentUser = () => {
    return $http({
      method: 'GET',
      url: '/me'
    })
  };

  this.addToPlaylist = (video, user) => {
    // console.log('authService video and user: ', video, user);
    return $http({
      method: "POST",
      url: "/api/addVideo",
      data: {
        video: video,
        user: user
      }
    })
  }


})
