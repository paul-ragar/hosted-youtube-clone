var Client = require('node-rest-client').Client;
var Axios = require('axios');
var API_KEY = require('../config').API_KEY;
const ytSearch = require('youtube-search');


var client = new Client();


const convertTime = (time) => {
 time = time.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
 var hours = (parseInt(time[1]) || 0);
 var minutes = (parseInt(time[2]) || 0);
 var seconds = (parseInt(time[3]) || 0);
 if(minutes === 0) {
   if(hours !== 0) {
     minutes += "0";
   }
 }
 if(seconds < 10) {
   if(seconds === 0) {
   seconds += "0";
   }
   else {
     seconds = "0" + seconds;
   }
 }
 if(hours === 0) {
   return minutes + ":" + seconds;
 }
 else {
   return hours + ":" + minutes + ":" + seconds;
 }
};



module.exports = {

    getTrending: function(req, res, next) {
        Axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=25&key=${API_KEY}`).then((results) => {
          // Narrows the results down to the 25 video objects
          results = results.data;
          //loops through each object and converts their 'duration' to needed format
          for(var i = 0; i < results.items.length; i++)
          {
            results.items[i].contentDetails.duration = convertTime(results.items[i].contentDetails.duration);
            // console.log('serverCtrl', results.items[i].contentDetails.duration );
          }
          // console.log(results);
          // console.log('outside the loop');
          // sends updated results
          res.send(results);
        }).catch(function(error) {
            // console.log("ERROR: ", error);
        });
    },

    // retrieve info for single video
    getVideoInfo: function(req, res, next) {
        var videoId = req.query.id;
        client.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${API_KEY}`, function(data, response) {
          //loops through the data and converts the duration of each item
          //also glean out the 'live' videos and sets their duration to ''
          //to prevent them from showing on the front end's landingPlaylistDir
          for(var i = 0; i < data.items.length; i++)
          {
            if(data.items[i].contentDetails.duration === 'PT0S')
            {
              data.items[i].contentDetails.duration = '';
            }
            else{
              data.items[i].contentDetails.duration = convertTime(data.items[i].contentDetails.duration);
            }
          }
            res.status(200).json(data);
        });
    },


    // retrieves comment thread for selected video
    getVideoComments: function(req, res, next) {
        var videoId = req.query.id;
        client.get(`https://www.googleapis.com/youtube/v3/commentThreads?part=replies,snippet&order=relevance&key=${API_KEY}&videoId=${videoId}`, function(data, response) {
            res.status(200).json(data);
        });
    },

    // retrieves videos in a playList based on playList id
    getPlaylistVideos: function(req, res, next) {
        var playListId = req.query.id;
        client.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${playListId}&key=${API_KEY}`, function(data, response) {
            res.status(200).json(data);
        });
    },


    // retrieves info for author of video on video player page. Grabbing subscriber count and user profile specifially
    getChannelInfoOnVidPlayer: function(req, res, next) {
        var channelId = req.query.id;
        client.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`, function(data, response) {
            res.status(200).json(data);
        })
    },

    getPlaylistInfo: function(req, res, next) {
      var playlistId = req.query.playlistId;
      client.get(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`, function(data, response) {
          res.status(200).json(data);
      })
    },


    // retrieves results from user's search bar request
    getSearchResults: (req, res, next) => {
        var videoIdArray = [];
        var channelIdArray = [];
        Axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${req.query.searched}&type=video,channel&key=${API_KEY}`)
            .then((results) => {
                results = results.data.items;
                // console.log("Original Results: ",results);
                for (var i = 0; i < results.length; i++) {
                    if (results[i].id.kind === "youtube#video") {
                        videoIdArray.push(results[i].id.videoId);
                    }
                    if (results[i].id.kind === "youtube#channel") {
                        channelIdArray.push(results[i].id.channelId);
                    }
                };
                // console.log("This is the Video Array: ",videoIdArray);
                videoIdArray = videoIdArray.join(',');
                // console.log("This is the Channel Array: ",channelIdArray);
                channelIdArray = channelIdArray.join(',');
                Axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoIdArray}&key=${API_KEY}&part=statistics,snippet,contentDetails`).then(function(response) {
                        var j = 0;
                        for (var i = 0; i < results.length; i++) {
                            // For Video specific info
                            if (results[i].id.kind === "youtube#video") {
                                results[i].viewCount = response.data.items[j].statistics.viewCount;
                                results[i].duration = convertTime(response.data.items[j].contentDetails.duration);
                                j++;
                            }
                        };
                        Axios.get(`https://www.googleapis.com/youtube/v3/channels?id=${channelIdArray}&key=${API_KEY}&part=statistics,snippet`).then(function(response) {
                                // console.log("CHANNEL RESPONSES: ", response.data.items);
                                var j = 0;
                                for (var i = 0; i < results.length; i++) {
                                    // For Video specific info
                                    if (results[i].id.kind === "youtube#channel") {
                                        results[i].videoCount = response.data.items[j].statistics.videoCount;
                                        results[i].subscriberCount = response.data.items[j].statistics.subscriberCount;
                                        j++;
                                    }
                                };
                                res.send(results);
                            })
                            .catch(function(error) {
                                // console.log("ERROR: ", error);
                            });
                    })
                    .catch(function(error) {
                        // console.log("ERROR: ", error);
                    });
            })
            .catch(function(error) {
                // console.log("ERROR: ", error);
            });
    },

    getChannelHoverInfo: (req,res,next) => {
      var channelId = req.query.id;
      client.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`, function(data, response) {
        res.status(200).json(data);
      })
    },

    getChannelData: (req,res,next) => {
      var channelId = req.query.id;
      client.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${channelId}&key=${API_KEY}`, function(data, response){
        // console.log(data.items);
        client.get(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&key=${API_KEY}`, function(data1, response){
          data.items[0].playlistData = data1.items;
          // console.log(data1.items);
          var videoTrailerId = data.items[0].brandingSettings.channel.unsubscribedTrailer;
          if (data.items[0].brandingSettings.channel.featuredChannelsUrls) {
            var featuredChannels = data.items[0].brandingSettings.channel.featuredChannelsUrls.join(',');
          }
          client.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${featuredChannels}&key=${API_KEY}`, function(data3, response){
            data.items[0].featuredChannelsData = data3.items;
            client.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoTrailerId}&key=${API_KEY}&part=statistics,snippet,contentDetails`, function(results, response) {
              data.items[0].channelTrailer = results.items[0];
              // console.log(results.items[0]);
              res.status(200).json(data);
            })
          })
        })
      })
    }





}
