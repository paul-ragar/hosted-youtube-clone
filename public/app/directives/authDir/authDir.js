angular.module('you-tube-clone')
.directive('authDir', () => {
  return {
    restrict: 'E',
    templateUrl: './app/directives/authDir/authDir.html',
    controller: ($scope, authService) => {


    $scope.register = (user) => {
      mainService.registerUser(user).then((response) => {
        if (!response.data) {
          alert('unable to create user');
        } else {
          alert('user created');
          $scope.newUser = {};
        }
      }).catch((err) => {
        alert('unable to create user');
      });
    };





    //END OF CONTROLLER
    }
  //END OF RETURN
  }
//END OF DIRECTIVE
})
