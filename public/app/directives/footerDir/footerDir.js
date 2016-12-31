angular.module('you-tube-clone')
.directive('footerDir', () => {
  return {
    restrict: 'E',
    templateUrl: './app/directives/footerDir/footerDir.html',
    controller: ($scope, mainService) => {

      // This is an example to link two arrays into a single object to be ng-repeated
      
      // var exampleArray = [1,2,3,4,5,6,7,8,9,10];
      // var exampleArray2 = [11,12,13,14,15,16,17,18,19,20];
      //
      // $scope.coupledData = exampleArray.map(function(value, index){
      //   return {
      //     data: value,
      //     value: exampleArray2[index]
      //   }
      // });

    }
  }
})
