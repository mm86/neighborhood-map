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
function Location(marker){

	var self = this;
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

		self.geocoder.geocode({'address': self.address()}, function(results, status) {

    	if (status === google.maps.GeocoderStatus.OK) {
      		map = new google.maps.Map(document.getElementById('map'), {
      		center: results[0].geometry.location,
      		zoom: 15
    	});
    	var service = new google.maps.places.PlacesService(map);
    	service.nearbySearch({
    		location: results[0].geometry.location,
    		radius: 2000,
    		types: ['aquarium','campground','zoo','amusement_park','park','museum']
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
  		
  		if(self.locationListArray().length !== 0){
  			self.locationListArray().length = 0;
  		}
  		for (var i = 0, place; place = places[i]; i++) {
    		var marker = new google.maps.Marker({
      			map: map,
	  			title: place.name,
      			position: place.geometry.location
    		});
    	 
        //locationListArray is an array that is a collection of objects(represents data for this application). 
        //each object has a title and position property.
		self.locationListArray.push(new Location(marker)); 	
    	bounds.extend(place.geometry.location);	
		}
 		map.fitBounds(bounds);
	};
    
	self.animateMarkers = function(data,event){
        
		var infowindow = new google.maps.InfoWindow();
		var searchTerm = event.target.innerHTML;
	
        for(var i = 0, len = self.locationListArray().length; i < len; i++) {  
		if(searchTerm === self.locationListArray()[i].marker.title){
        		 infowindow.setContent(self.locationListArray()[i].marker.title);
                 infowindow.open(map, self.locationListArray()[i].marker);
				 self.infoWindowList.push(infowindow);
				 if(self.count>0){self.infoWindowList[self.count-1].close();}
				 self.count=self.count+1;
				 self.locationListArray()[i].marker.setAnimation(google.maps.Animation.BOUNCE);
				(function(clickedMarker) {
                	setTimeout(function(){ clickedMarker.setAnimation(null); }, 750);
				})(self.locationListArray()[i].marker);		
		}
	    };
	};
};

//This function is google maps API's callback function
function startApp() {
	initMap(); //call the initMap function here
	ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}