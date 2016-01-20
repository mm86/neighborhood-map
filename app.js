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
function Location(name,lat,lng,phone,img_url,rating,rating_img,addr1,addr2) {
  var self = this; 
  self.name = name;
  self.lat = lat;
  self.lng = lng;
  self.phone = phone;
  self.img_url = img_url;
  self.rating = rating;
  self.rating_img = rating_img;
  self.addr1 = addr1;
  self.addr2 = addr2;
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
  self.query = ko.observable('');
  self.markerList = ko.observableArray(); // Push markers into an array for filtersearch results
  // Now that we have the address, we can use geocoder to get the location and display marker
  // Define and use google maps objects here
  self.geocoder = new google.maps.Geocoder();
  // Create other functions to communicate with the Model, Observables, and Google's Maps (this can be thought of as a View)
  // array that holds a list of location objects, make this an observable array.why observable? cause the list 
  // is dynamic and changes for every address input.
  self.count = 0;
  self.infoWindowList = [];
  self.locationListArray = ko.observableArray();
  self.listOfLocations = function(){
      if(self.locationListArray().length !== 0){self.locationListArray().length = 0;}
      self.getYelpData(self.address());
  }

  self.animateMarkers = function(index) {
    var infowindow = new google.maps.InfoWindow();
       var infoContent = '<div><h4>' + self.locationListArray()[index].name + '</h4>' +
                         '<img src='+self.locationListArray()[index].rating_img+'><br>' +
                         '<img src='+self.locationListArray()[index].img_url+'></div>';
        infowindow.setContent(infoContent);
        infowindow.open(map, self.locationListArray()[index].marker);
        self.infoWindowList.push(infowindow);
        if (self.count > 0) {
          self.infoWindowList[self.count - 1].close();
        }
        self.count = self.count + 1;
        self.locationListArray()[index].marker.setAnimation(google.maps.Animation.BOUNCE);
        (function(clickedMarker) {
          setTimeout(function() {
            clickedMarker.setAnimation(null);
          }, 750);
        })(self.locationListArray()[index].marker); 
  };


  self.displayMarker = function(){
    self.markerList().forEach(function(marker){
      marker.setVisible(true);
    });
  };
  

  self.searchFilter = ko.computed(function(){
    var filter = self.query().toLowerCase();
    if (!filter){
      self.displayMarker();  
      return self.locationListArray(); 
    } else {
    return ko.utils.arrayFilter(self.locationListArray(), function(point){
      for (var i = 0; i < self.markerList().length; i++){ 
          if (self.markerList()[i].title.toLowerCase().indexOf(filter) !== -1){
            self.markerList()[i].setVisible(true);
          } else { 
            self.markerList()[i].setVisible(false);
          }
      }
      return point.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0;
    });
  }
  });


  self.getYelpData = function(address){
 /**
 * Generates a random number and returns it as a string for OAuthentication
 * @return {string}
 */
console.log(address);
function nonce_generate() {
  return (Math.floor(Math.random() * 1e12).toString());
}
var yelp_url = 'http://api.yelp.com/v2/search';

    var parameters = {
      
      oauth_consumer_key: 'U3i6g2plvtRlHuwvFO9VAA',
      oauth_token: 'NU1k3_HCN2gg1rlHqBa347qu-ulDLFXx',
      oauth_nonce: nonce_generate(),
      oauth_timestamp: Math.floor(Date.now()/1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version : '1.0',
      callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
      location: address,
      term: 'active',
      category_filter: 'gardens,parks,zoos,aquariums',
      limit: 20
      
    };
    
    var consumer_secret = 'Hge_8nzOiPYng41v4EkjEJNTe7I';
    var token_secret = 'iP1-9Hmy1kY8LtgZ2OpSRsE0kYk';
    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, consumer_secret, token_secret);
    parameters.oauth_signature = encodedSignature;

    var settings = {
      url: yelp_url,
      data: parameters,
      cache: true,   // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", 
      //invalidating our oauth-signature
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      success: function(results) {
      
      map = new google.maps.Map(document.getElementById('map'), {
          center: {lat:results.region.center.latitude,lng:results.region.center.longitude},
          zoom: 12
      });
      for(var i = 0; i < results.businesses.length;i++){
        self.locationListArray.push(new Location(results.businesses[i].name,results.businesses[i].location.coordinate.latitude,results.businesses[i].location.coordinate.longitude,results.businesses[i].phone,results.businesses[i].image_url,results.businesses[i].rating,results.businesses[i].rating_img_url_small,results.businesses[i].location.display_address[0],results.businesses[i].location.display_address[1]));
        self.markerList.push(self.locationListArray()[i].marker);
        
      }
      },
      fail: function(xhr, status, error) {
      console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
      }
    };
    // Send AJAX query via jQuery library.
    $.ajax(settings);
  
  };


};
//This function is google maps API's callback function
function startApp() {
  initMap(); //call the initMap function here
  ko.applyBindings(new MapViewModel()); //bind the viewmodel with Knockout
}

















