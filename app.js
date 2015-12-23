
 // ---- Knockout MVVM pattern-----

var map;
var infowindow;

function initMap() {

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: -34.397, lng: 150.644}
	});

};

// ViewModel
function MapViewModel(){
    
	var self = this;

	//ViewModel gets the data from the submit button and stores it in the observable variable address
	self.address = ko.observable("sydney, NSW");
	// Now that we have the address, we can use geocoder to get the location and display marker
	self.geocoder = new google.maps.Geocoder();
	self.displayLocMarker = function(){
			self.geocoder.geocode({'address': self.address()}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
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

function startApp(){
	initMap(); //call the initMap function here
	ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}


