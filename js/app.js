/**
 * Outdoors - An interactive map that displays all outdoors related activities and places to visit near a given location(address, zipcode).
   Map is built in accordance with Knockout's MVVM pattern.
 * @author Madhu
 * @required knockout.js, bootstrap, jquery
 */
'use strict';
var map;
var infowindow;

/**
* @function initMap
  @description Displays the initial map on application load
*/

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: {
        lat: -34.397,
        lng: 150.644
      }
    });

    //Resize the map for responsive design 
    google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      google.maps.event.trigger(map, "resize");
      map.setCenter(center);
    });
  }
  /**
   *
   * @constructor Location
   * @Description Represents the model (of the MVVM pattern) for this application
   * @param {object} data - Represents data from Yelp API.
   */

function Location(data) {
  var self = this;
  self.name = data.name;
  self.lat = data.location.coordinate.latitude;
  self.lng = data.location.coordinate.longitude;
  self.phone = data.phone;
  self.img_url = data.image_url;
  self.rating = data.rating;
  self.rating_img = data.rating_img_url_small;
  self.addr1 = data.location.display_address[0];
  self.addr2 = data.location.display_address[1];
  self.category = data.categories[0][0];
  self.snippet = data.snippet_text;
  self.review_url = data.url;
  self.weather = ko.observable();
  //properties associated with visible binding
  self.reviewVisible = ko.observable(false);
  self.dataVisible = ko.observable(true);
  //infowindow and marker creation for each location
  infowindow = new google.maps.InfoWindow;
  var image;
  if (self.category === 'Zoos') {
    image = 'images/zoo.png';
  } else if (self.category === 'Aquariums') {
    image = 'images/fish.png';
  } else if (self.category === 'Botanical Gardens') {
    image = 'images/garden.png';
  } else {
    image = 'images/parks.png';
  }

  //creating a marker object for each location  
  self.marker = new google.maps.Marker({
    position: new google.maps.LatLng(self.lat, self.lng),
    map: map,
    icon: image,
    title: this.name
  });
  //get weather details from weather API
  var url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + self.lat + '&lon=' + self.lng +
    '&appid=44db6a862fba0b067b1930da0d769e98';

   $.ajax({
    url: url,
    dataType: 'jsonp',
    success: function(results) {
      self.weather = results.weather[0].icon;
      //attach event listener click to each marker
      google.maps.event.addListener(self.marker, 'click', function() {

        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          self.marker.setAnimation(null);
        }, 1400);
        self.infocontent = '<img src="http://openweathermap.org/img/w/' + self.weather +
          '.png">' + '<p>' + self.name + '</p>';

        infowindow.setContent(self.infocontent);
        infowindow.open(map, self.marker);


      });
    }
  })
    .fail(function() {
      alert("Data could not be retrieved from Weather API");
    });

};


Location.prototype.showReviewData = function() {
  var self = this;
  self.reviewVisible(!self.reviewVisible());
  self.dataVisible(!self.dataVisible());
};

Location.prototype.showLocationData = function() {
  var self = this;
  self.reviewVisible(!self.reviewVisible());
  self.dataVisible(!self.dataVisible());
};


/**
 * @class MapViewModel
 * @description Represents the ViewModel here
 */
function MapViewModel() {
  var self = this;
  self.address = ko.observable("sydney, NSW");
  self.query = ko.observable('');
  self.geocoder = new google.maps.Geocoder();
  self.locationListArray = ko.observableArray();


  /**
   * @function listOfLocations
   * @description Binds with the form element (search box). Used for retrieving information from Yelp API for each location submission
   */
  self.listOfLocations = function() {

    if (self.locationListArray().length !== 0) { //set the locationListArray to empty for every new address search.
      self.locationListArray().length = 0;

    }

    self.getYelpData(self.address()); //call Yelp API for retrieving list of locations and their information for further display

  };


  /**
   * @function animateMarkers
   * @description For every list item clicked on the display, corresponding marker is bounced along with an infowindow
   * represting information about the marker. This function is bound to the list item in index.html through click binding
   * @param {object} data : Represents the location item clicked in the list view.
   */

  self.animateMarker = function(data) {

    //get the index number of the list item clicked.
    var index;
    for (var i = 0, len = self.locationListArray().length; i < len; i++) {
      if (self.locationListArray()[i].name === data.name) {
        index = i;
        break;
      }
    }
    //trigger the marker's listener method
    google.maps.event.trigger(self.locationListArray()[index].marker, 'click');

  };

  /**
   * @function searchFilter
   * @description Dynamic live search filter method. searchFilter is a computed observable that keeps the
   * view and viewmodel in sync during the search process.
   */
  self.searchFilter = ko.computed(function() {

    var filter = self.query().toLowerCase();
    if (!filter) {
      self.locationListArray().forEach(function(mk) {
        mk.marker.setVisible(true);
      });
      return self.locationListArray();
    } else {
      return ko.utils.arrayFilter(self.locationListArray(), function(loc) {
        for (var i = 0; i < self.locationListArray().length; i++) {
          if (self.locationListArray()[i].marker.title.toLowerCase().indexOf(filter) !== -1) {
            self.locationListArray()[i].marker.setVisible(true);
          } else {
            self.locationListArray()[i].marker.setVisible(false);
          }
        }
        return loc.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0;
      });
    }
  });


  /**
   * @function getYelpData
   * @description Given the address, retrieves information from Yelp API for further display and information
   * @param {string} address: KO observable that keeps the view and viewmodel in sync
   */
  self.getYelpData = function(address) {
    /**
     * Generates a random number and returns it as a string for OAuthentication
     * @return {string}
     */
    function nonce_generate() {
      return (Math.floor(Math.random() * 1e12).toString());
    }
    var yelp_url = 'http://api.yelp.com/v2/search';
    var parameters = {
      oauth_consumer_key: 'U3i6g2plvtRlHuwvFO9VAA',
      oauth_token: 'NU1k3_HCN2gg1rlHqBa347qu-ulDLFXx',
      oauth_nonce: nonce_generate(),
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
      callback: 'cb',
      location: address,
      term: 'active',
      category_filter: 'gardens,parks,zoos,aquariums',
      limit: 20
    };
    var consumer_secret = 'Hge_8nzOiPYng41v4EkjEJNTe7I';
    var token_secret = 'iP1-9Hmy1kY8LtgZ2OpSRsE0kYk';
    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters,
      consumer_secret, token_secret);
    parameters.oauth_signature = encodedSignature;
    $.ajax({
      url: yelp_url,
      data: parameters,
      cache: true,
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      success: function(results) {
        //set the map according to the result's coordinates
        map = new google.maps.Map(document.getElementById('map'), {
          center: {
            lat: results.region.center.latitude,
            lng: results.region.center.longitude
          },
          zoom: 12
        });
        //change map display to display the markers on the right side of the page
        map.panBy(-200, 90);
        for (var i = 0; i < results.businesses.length; i++) {
          //push location details into locationListArray by creating a new instance of Location class for each location.
          self.locationListArray.push(new Location(results.businesses[i]));
        }

      }
    })
      .fail(function() {
        alert("Data could not be retrieved from Yelp API");
      });

  };

}


/**
 * @function startApp
 * @description callback function that is executed once google Maps asynchronous load is ready
 */
function startApp() {
    initMap();
    var viewmodel = new MapViewModel();
    ko.applyBindings(viewmodel);
    viewmodel.listOfLocations();
    
  }
/**
 * @function googleError
 * @description gets called when google maps is down or cannot be loaded at the moment
 */

function googleError() {
  alert("google API cannot be loaded now");
}