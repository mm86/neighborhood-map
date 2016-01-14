// ---- Knockout MVVM pattern-----
var map;
var infowindow;
var geocoder;
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

//End of Model
	// ViewModel - handles all the interactions between the view and the model
function MapViewModel() {
	var self = this;
	// ViewModel gets the data from the submit button and stores it in the observable variable address
	// Define all the observables here
	self.address = ko.observable("sydney, NSW");
	// Now that we have the address, we can use geocoder to get the location and display marker
	// Define and use google maps objects here
	geocoder = new google.maps.Geocoder();
	// Create other functions to communicate with the Model, Observables, and Google's Maps (this can be thought of as a View)
	self.displayLocMarker = function() {
		return displayMarkers(self.address);
	}
};

//This function is google maps API's callback function
function startApp() {
	initMap(); //call the initMap function here
	ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}