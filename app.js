// ---- Knockout MVVM pattern-----
var map;
//function to display initial map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {
      lat: -34.397,
      lng: 150.644
    }
  });
};
//Start of MODEL in the MVVM pattern
function Location(name,lat,lng,address) {
  var self = this; 
  self.name = name;
  self.lat = lat;
  self.lng = lng;
  self.address = address;
  //create a marker object for each location
  var marker;
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(self.lat, self.lng),
    map: map,
    title: self.name
  });
  self.marker = marker;
};
//End of MODEL
// ViewModel - handles all the interactions between the view and the model
function MapViewModel() {
  var self = this;
  // ViewModel gets the data from the submit button and stores it in the observable variable address
  // Define all the observables here
  self.address = ko.observable("sydney, NSW");
  // Now that we have the address, we can use geocoder to get the location and display marker
  // Define and use google maps objects here
  self.geocoder = new google.maps.Geocoder();
  // Create other functions to communicate with the Model, Observables, and Google's Maps (this can be thought of as a View)
  // array that holds a list of location objects, make this an observable array.why observable? cause the list 
  // is dynamic and changes for every address input.
  self.count = 0;
  self.infoWindowList = [];
  self.locationListArray = ko.observableArray();
  self.listOfLocations = function() {
    self.geocoder.geocode({
      'address': self.address()
    }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        map = new google.maps.Map(document.getElementById('map'), {
          center: results[0].geometry.location,
          zoom: 15
        });
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch({
          location: results[0].geometry.location,
          radius: 2000,
          types: ['aquarium', 'campground', 'zoo', 'amusement_park', 'park',
            'museum'
          ]
        }, self.processResults); //callback function will be called back (or executed) inside the nearbySearch function
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
  self.processResults = function(results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
      return;
    } else {
      self.createMarkers(results);
    }
  };
  self.createMarkers = function(places) {
    var bounds = new google.maps.LatLngBounds();
    if (self.locationListArray().length !== 0) {
      self.locationListArray().length = 0;
    }

    for (var i = 0, place; place = places[i]; i++) {
      
      self.locationListArray.push(new Location(place.name,place.geometry.location.lat(),place.geometry.location.lng(),place.address));
      
      bounds.extend(place.geometry.location);
    }
    map.fitBounds(bounds);
  };
  self.animateMarkers = function(data, event) {
    var infowindow = new google.maps.InfoWindow();
    var searchTerm = event.target.innerHTML;
    for (var i = 0, len = self.locationListArray().length; i < len; i++) {
      if (searchTerm === self.locationListArray()[i].name) {
        infowindow.setContent(self.locationListArray()[i].name);
        infowindow.open(map, self.locationListArray()[i].marker);
        self.infoWindowList.push(infowindow);
        if (self.count > 0) {
          self.infoWindowList[self.count - 1].close();
        }
        self.count = self.count + 1;
        self.locationListArray()[i].marker.setAnimation(google.maps.Animation.BOUNCE);
        (function(clickedMarker) {
          setTimeout(function() {
            clickedMarker.setAnimation(null);
          }, 750);
        })(self.locationListArray()[i].marker);
      }
    };
    self.displayYelpDetails();
  };

  self.displayYelpDetails = function(){
   
      console.log("hi");
  };


};
//This function is google maps API's callback function
function startApp() {
  initMap(); //call the initMap function here
  ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}

















