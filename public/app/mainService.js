angular.module('you-tube-clone')
.service('mainService', function($http, $state) {

this.broken = 'working'

  this.getTrending = () => {
    return $http({
      method:'GET',
      url: '/api/trending'
    }).then((response) => {
      // console.log('hello from the mainnService',response);
      return response.data;
    })
  }
  this.singleVid = [];
  this.passVideo = (video) => {
    this.singleVid[0] = video;
  }

  this.getVideoInfo = (id) => {
    return $http({
      method: 'GET',
      url: `/api/watch/?id=${id}`
    }).then((response) => {
      return response.data;
    })
  }

  this.getComments = (id) => {

    return $http({
      method: 'GET',
      url: `/api/comments/?id=${id}`
    }).then((response) => {

      return response.data;
    })
  }

  this.getSearchResults = (searched) => {
    // console.log("searched: ", searched);
    // searched = searched + '';
    searched = searched.replace(/ /g,"%20");
    return $http({
      method: 'GET',
      url: '/api/search?searched=' + searched
    }).then((response) => {
      // console.log("From the mainService: ",response.data);
      return response.data;
    })
  }

  this.getChannelInfoOnVidPlayer = id => {
    return $http({
      method:'GET',
      url: `/api/channelInfo/?id=${id}`
    }).then((response) => {
      return response.data;
    })
  }

  this.getHomePlaylist = (id) => {
    return $http({
      method: 'GET',
      url: `/api/playList/?id=${id}`
    }).then((response) => {
      return response.data;
    })
  }

  this.getChannelHoverInfo = (id) => {
    // console.log("mainService :", id);
    return $http({
      method: 'GET',
      url: `/api/channelHoverInfo/?id=${id}`
    }).then((response) => {
      // console.log("response: ", response);
      // console.log("Hover Array",response.data.items[0]);
      return response.data.items[0];

    })
  }


  this.getPlaylistInfo = (id) => {
    return $http({
      method: 'GET',
      url: `/api/playlistInfo/?playlistId=${id}`
    }).then((response) => {
      return response.data;
    })
  }

  this.getPlaylist = () => {
    return $http({
      method: 'GET',
      url: "/api/user-playlist/",
      data: {
        user: user
      }
    }).then((response) => {
      return response.data;
    })
  }

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

  this.getCurrentUserPlaylist = (user) => {
    return $http({
      method: 'GET',
      url: `/api/user/playlist/${user.id}`
    }).then((response) => {
      const vidArr = response.data;
      // var newVidArr = [];
      for (var i = 0; i < vidArr.length; i++) {
        vidArr[i].video = JSON.parse(vidArr[i].video);
      }

      return vidArr;
    })
  }


  this.postComment = (comment, vidId, channelId) => {
    return $http({
      method: 'POST',
      url: '/api/comments',
      data: {
        comment: comment,
        vidId: vidId,
        channelId: channelId
      }
    }).then((response) => {
      return response.data;
    })
  }


  this.getChannelData = (id) => {
    return $http({
      method: 'GET',
      url: `/api/channelData/?id=${id}`
    }).then((response) => {
      return response.data.items[0];
    })
  }

  this.removeVideo = (id) => {
    return $http({
      method: 'DELETE',
      url: `/api/remove/playlist-video/${id}`
    }).then((response) => {
      // console.log('did vid delete?', response.data);
      return response.data;
    })
  }






})
