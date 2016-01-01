
 // ---- Knockout MVVM pattern-----

var map;
var infowindow;

// creates an instance of the google Maps class with the global map variable
// and sets the initial location to a certain geographic place through coordinates
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: -34.397, lng: 150.644}
	});
};


//Model Functions and Classes

function google_geocode(){


};
// ViewModel
function MapViewModel(){
	var self = this;
	// ViewModel gets the data from the submit button and stores it in the observable variable address
	// Define all the observables here
	self.address = ko.observable("sydney, NSW"); 
	// Now that we have the address, we can use geocoder to get the location and display marker
	// Define and use google maps objects here
	self.geocoder = new google.maps.Geocoder();
    // Create other functions to communicate with the Model, Observables, and Google's Maps (this can be thought of as a View)

	self.displayLocMarker = function(){
		    
			self.geocoder.geocode({'address': self.address()}, function(results, status) {
			
			if (status === google.maps.GeocoderStatus.OK) {
			//to create new markers and delete old ones for every new location submission
            map = new google.maps.Map(document.getElementById('map'), {
      			center: results[0].geometry.location,
      			zoom: 15
            });

			map.setCenter(results[0].geometry.location);
			 self.marker = new google.maps.Marker({
				map: map,
				center: results[0].geometry.location,
      			zoom: 15
			});

			infowindow = new google.maps.InfoWindow();
    		self.service = new google.maps.places.PlacesService(map);
    		self.service.nearbySearch({
    			location: results[0].geometry.location,
    			radius: 500,
    			types: ['store']
  			}, callback);
    		} 

			else {
			alert('Geocode was not successful for the following reason: ' + status);
			};
	});
	};
};


function callback(results, status) {

  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {

  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

//This function is google maps API's callback function
function startApp(){
	initMap(); //call the initMap function here
	ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}


