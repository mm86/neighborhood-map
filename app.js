
 // ---- Knockout MVVM pattern -----
var map;
  
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: {lat: -34.397, lng: 150.644}
  });
  //call function MapViewModel() here
  ko.applyBindings(new MapViewModel());
}

function MapViewModel(){
	
	var self = this;
	
	//ViewModel gets the data from the submit button and stores it in an observable object address
	self.address = ko.observable("sydney, NSW");
	// Now that we have the address, we can use geocoder to get the location and display marker
	self.geocoder = new google.maps.Geocoder();
	self.displayLocMarker = function(){
		  self.geocoder.geocode({'address': self.address()}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location
			});
			} else {
			alert('Geocode was not successful for the following reason: ' + status);
			};
	});
		
	}
};


