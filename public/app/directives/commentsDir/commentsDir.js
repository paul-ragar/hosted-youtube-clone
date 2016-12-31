angular.module('you-tube-clone')
  .directive('commentsDir', () => {
    return {
      restrict: 'E',
      templateUrl: './app/directives/commentsDir/commentsDir.html',
      scope: {
        vidId: '=',
        commentCount: '=',
        channelId: '='
      },
      controller: ($scope, mainService, $sce, $timeout) => {
        $scope.$watch('vidId', () => {
          var vidId = $scope.vidId;

          if(vidId) {
            $scope.getComments = (vidId) => {
              mainService.getComments(vidId).then((response) => {
                $scope.comments = response;
              })
            }
            $scope.getComments(vidId);
          }



          $scope.postComment = (comment, vidId, channelId) => {
            mainService.postComment(comment, vidId, channelId).then((response) => {
              $scope.newComment = response;

              $timeout(function() {
                $scope.getComments = (vidId) => {
                  mainService.getComments(vidId).then((response) => {
                    $scope.comments = response;
                  })
                }
                $scope.getComments(vidId);
              }, 1000)
            })
          }
        })

        $scope.commentTime = (dateObj)=> {
          dateObj = moment(dateObj, 'YYYYMMDD').fromNow();
          return dateObj;
        }

        $scope.isDisabled = true;
      $(document).ready(function(){
        const commentArea = $('.comment-area');
        const submitComment = $('.submit-comment');


        commentArea.on('click', function(){
          $('.comment-btn').css('display','flex');
          // submitComment.setEnabled(false);
        })

        commentArea.keydown(function(){
          var count = commentArea.val().length;
          if(count > 0) {
            $scope.isDisabled = false;
            submitComment.css('opacity','1');
          } else {
            $scope.isDisabled = true;
            submitComment.css('opacity','.3');
          }
        })

        $('.cancel-comment').on('click', function() {
          $('.comment-btn').css('display','none');
        })
      })


      //end of controller
      }
    }
  })
