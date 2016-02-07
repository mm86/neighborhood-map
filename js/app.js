/**
 * Outdoors - An interactive map that displays all outdoors related activities and places to visit near a given location(address, zipcode).
   Map is built in accordance with Knockout's MVVM pattern.
 * @author Madhu
 * @required knockout.js, bootstrap, jquery
 */
'use strict';
var map;

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
      console.log("resize");
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
  self.phone = data.phone; //ERROR TO FIX:if value not available, display NA
  self.img_url = data.image_url;
  self.rating = data.rating;
  self.rating_img = data.rating_img_url_small;
  self.addr1 = data.location.display_address[0];
  self.addr2 = data.location.display_address[1];
  self.category = data.categories[0][0];
  self.snippet = data.snippet_text;
  self.review_url = data.url;
  //methods and properties associated with visible binding
  self.reviewVisible = ko.observable(false);
  self.dataVisible = ko.observable(true);
  self.showReviewData = function() {
    self.reviewVisible(!self.reviewVisible());
    self.dataVisible(!self.dataVisible());
  };
  self.showLocationData = function() {
    self.reviewVisible(!self.reviewVisible());
    self.dataVisible(!self.dataVisible());
  };

}


/**
 * @class MapViewModel
 * @description Represents the ViewModel here
 */
function MapViewModel() {
  var self = this;
  self.address = ko.observable("sydney, NSW");
  self.query = ko.observable('');
  self.count = 0;
  self.infoWindowList = [];
  self.geocoder = new google.maps.Geocoder();
  self.locationListArray = ko.observableArray();
  self.markerList = ko.observableArray();


  /**
   * @function listOfLocations
   * @description Binds with the form element (search box). Used for retrieving information from Yelp API for each location submission
   */
  self.listOfLocations = function() {

    if (self.locationListArray().length !== 0) { //set the locationListArray to empty for every new address search.
      self.locationListArray().length = 0;
      self.markerList().length = 0;
    }

    self.getYelpData(self.address()); //call Yelp API for retrieving list of locations and their information for further display
    
  };


  /**
   * @function animateMarkers
   * @description For every list item clicked on the display, corresponding marker is bounced along with an infowindow
   * represting information about the marker. This function is bound to the list item in index.html through click binding
   * @param {object} data : Represents the location item clicked in the list view.
   */
  self.animateMarkers = function(data) {

    //get the index number of the list item clicked.
    var index;

    for (var i = 0, len = self.locationListArray().length; i < len; i++) {
      if (self.locationListArray()[i].name === data.name) {
        index = i;
        break;
      }
    }
    //trigger the marker's listener method
    google.maps.event.trigger( self.markerList()[index], 'click' );

  };
  /**
   * @function weatherMarkerData
   * @description Gets the weather information for each location, adds an addListener method to each marker
   * and displays the information through the infowindow.
   * @param {object} data : Represents the marker object for the clicked location from the list view.
   * @param {number} lat : Represents the geographic coordinates of the location.
   * @param {number} lng : Represents the geographic coordinates of the location.
   */
  self.weatherMarkerData = function(data,lat,lng) {
    self.infowindow = new google.maps.InfoWindow;
    
    
    //call Weather API for weather details of each location
    var url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng +
      '&appid=44db6a862fba0b067b1930da0d769e98';
    
    var settings = {
      url: url,
      dataType: 'jsonp',
      success: function(results) {
        self.weatherIcon = results.weather[0].icon;
        //display the name and weather info of the location through the infowindow
        google.maps.event.addListener(data, 'click', function() {
        data.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          data.setAnimation(null);
        }, 1400);
        self.infocontent = '<img src="http://openweathermap.org/img/w/' + self.weatherIcon +
          '.png">' + '<p>' + data.title + '</p>';
        self.infowindow.setContent(self.infocontent);
        self.infowindow.open(map, data);
  
      });
      },
      fail: function(xhr, status, error) {
        console.log("An AJAX error occured: " + status + "\nError: " + error +
          "\nError detail: " + xhr.responseText);
      }
    };
    $.ajax(settings);
    };
  
  
  /**
   * @function searchFilter
   * @description Dynamic live search filter method. searchFilter is a computed observable that keeps the 
   * view and viewmodel in sync during the search process.
   */
  self.searchFilter = ko.computed(function() {
    var filter = self.query().toLowerCase();
    if (!filter) {
      self.markerList().forEach(function(mk) {
      mk.setVisible(true);
      });
      return self.locationListArray();
    } else {
      return ko.utils.arrayFilter(self.locationListArray(), function(loc) {
         for (var i = 0; i < self.locationListArray().length; i++) {
          if (self.markerList()[i].title.toLowerCase().indexOf(filter) !== -1) {
            self.markerList()[i].setVisible(true);
          } else {
            self.markerList()[i].setVisible(false);
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
    var settings = {
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

          //Display different marker icons for different categories
          var image;
          if (self.locationListArray()[i].category === 'Zoos') {
            image = 'images/zoo.png';
          } else if (self.locationListArray()[i].category === 'Aquariums') {
            image = 'images/fish.png';
          } else if (self.locationListArray()[i].category === 'Botanical Gardens') {
            image = 'images/garden.png';
          } else {
            image = 'images/parks.png';
          }
          //create a marker object for each location and display the markers on the map
          var marker;
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(self.locationListArray()[i].lat,
              self.locationListArray()[i].lng),
            map: map,
            icon: image,
            title: self.locationListArray()[i].name
          });
          //save the marker objects in an array for further use (search filter)
          self.markerList.push(marker);
          //pass the marker object and location coordinates to weatherMarkerData function 
          self.weatherMarkerData(self.markerList()[i],self.locationListArray()[i].lat,self.locationListArray()[i].lng);
        }
        
      },
      fail: function(xhr, status, error) {
        console.log("An AJAX error occured: " + status + "\nError: " + error +
          "\nError detail: " + xhr.responseText);
      }
    };
    $.ajax(settings);
  };

}


/**
 * @function startApp
 * @description callback function that is executed once google Maps asynchronous load is ready
 */
function startApp() {
  initMap();
  ko.applyBindings(new MapViewModel());
}