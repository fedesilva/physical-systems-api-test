var propertiesApp = angular.module('propertiesApp', []);

propertiesApp.controller('PropCtrl', function ($scope, $http, $filter) {

    // Get Markets
    $http.get("/markets").then(function(response) {
        $scope.markets = response.data;

    });

    // Get Countries
    $http.get("/countries").then(function(response) {
        $scope.countries = response.data;

    });

    // Get Properties
    $http.get("/properties").then(function(response) {
        $scope.cleanProperties = response.data;
        $scope.dirtyProperties = response.data;
        $scope.dirtyProperties.forEach(function(e) {
            createMarker(e);
        });
    });

    // Create Blank Property
    $scope.newProperty = {
        "id": null,
        "name": null,
        "desks": null,
        "Sf": null,
        "address1": null,
        "address2": null,
        "city": null,
        "state": null,
        "postalCode": null,
        "latitude": null,
        "longitude": null,
        "countryId": null,
        "regionalCategory": null,
        "marketId": null,
        "submarketId": null,
        "locationId": null
    };

    $scope.createProperty = function(item) {
        if (item) {
            if (item.name !== undefined &&
                item.address1 !== undefined &&
                item.latitude !== undefined &&
                item.longitude !== undefined &&
                item.marketId !== undefined) {
                $http.post('/properties', item).then(function(response) {
                    createMarker(item);
                    item.id = response.data.id;
                    $scope.newProperty = {};
                    $scope.cleanProperties.push(item);
                    jQuery('#addNew').collapse('toggle');
                });
            }
        }
    }

    // Update Property
    var updateProperty = function(item, prop) {
        var propName = item.key;
        var postObject = prop;
        postObject[propName] = item.value;

        $http.put('/properties/' + postObject.id, postObject).then(function(response) {
        });
    }

    // Delete Properties
    $scope.deleteProperty = function(item) {
        $http.delete('/properties/' + item.id, item).then(function(response) {
            var index = $scope.cleanProperties.indexOf(item);
            $scope.cleanProperties.splice(index, 1);
            $scope.markers[index].setMap(null);
        });
    }

    // Store markers to delete them
    $scope.markers = [];

    // Setup Map
    var mapCoords = {
        zoom: 12, // Get close to Manhattan
        center: new google.maps.LatLng(40.758896, -73.985130), // Centered on Manhattan
    }

    // Create Map
    $scope.map = new google.maps.Map(document.getElementById('map'), mapCoords);  // Need the element, not the jQuery equivalent
    // Update New Property
    $scope.map.addListener('click', function(e) {
        $scope.newProperty['latitude'] = e.latLng.lat();
        $scope.newProperty['longitude'] = e.latLng.lng();
        $scope.$digest();
    });

    var createMarker = function (info){

        var marker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng(info.latitude, info.longitude),
            title: info.name,
        });

        google.maps.event.addListener(marker, 'click', function(){
            // Get Market
            info.market = $filter("filter")($scope.markets, {id:info.marketId});
            // Get Country if needed
            // info.country = $filter("filter")($scope.countries, {id:info.countryId});
            // Modal Options
            jQuery('#propLightBox').on('show.bs.modal', function (event) {
              var button = $(event.relatedTarget) // Button that triggered the modal
              var modal = $(this)
              modal.find('.modal-title').text(info.name)
              modal.find('.modal-body .prop-address').text(info.address1)
              modal.find('.modal-body .prop-market').text(info.market[0].name)
            });

            jQuery('#propLightBox').modal();
        });

        // Store markers
        $scope.markers.push(marker);
    }

    // Switch from grid to list
    $scope.openItem = function(id) {
        $scope.toggleGrid();
        $scope.toggleList();
        jQuery('#collapse' + id).collapse('show');
    }

    // Get Market Name -> MarkeId
    $scope.getMarketId = function(id) {
        var market = $filter("filter")($scope.markets, {id:id});
        return market[0].name;
    }

    // Retrieve MarkteId from form
    $scope.updateId = function() {
        $scope.newProperty.marketId = event.srcElement.value;
    }

    // Update entries in DB -- could be on a click, but prefer onblur and Enter
    $scope.updateItem = function(item, prop) {
        if ( event.keyCode === 13 ) {
            updateProperty(item, prop);
        }
        if ( event.type === "blur" ) {
            updateProperty(item, prop);
        }
    }

    // Toggle List
    $scope.toggleList = function() {
        jQuery('.properties-list').toggleClass('in');
        jQuery('.property-grid').removeClass('in');
    }

    // Toggle Grid
    $scope.toggleGrid = function() {
        jQuery('.properties-list').removeClass('in');
        jQuery('.property-grid').toggleClass('in');
    }

});

// Custom filter to sort objects by a property ( lifted from SO )
propertiesApp.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});
