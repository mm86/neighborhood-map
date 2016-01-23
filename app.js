/**
 * Outdoors - An interactive map that displays all outdoors related activities and places to visit near a given location(address, zipcode).
   Map is built in accordance with Knockout's MVVM pattern.
 * @author Madhu
 * @required knockout.js, bootstrap, jquery
 */
var map;
/**
* @function initMap 
  @description Displays the initial map on application load
*/
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {
      lat: -34.397,
      lng: 150.644
    }
  });
}
/**
 * 
 * @constructor Location
 * @Description Represents the model (of the MVVM pattern) for this application
 * @param {string} name - Name of the location.
 * @param {string} lat - Latitude of the location.
 * @param {string} lng - Longitude of the location.
 * @param {string} phone - Phone number of the location.
 * @param {string} img_url - Image url of the location.
 * @param {string} rating - Rating of the location.
 * @param {string} rating_img - Rating image of the location.
 * @param {string} addr1 - Address line no:1 of the location.
 * @param {string} addr2 - Address line no:2 of the location
 * @param {string} category - Catgegory under which the location is placed.
 */
function Location(name, lat, lng, phone, img_url, rating, rating_img, addr1,addr2, category) {
  var self = this;
  self.name = name;
  self.lat = lat;
  self.lng = lng;
  self.phone = phone; //if value not available, display NA
  self.img_url = img_url;
  self.rating = rating;
  self.rating_img = rating_img;
  self.addr1 = addr1;
  self.addr2 = addr2;
  self.category = category;
  //Change marker icons based on their category
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
  //create a marker object for each location
  var marker;
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(self.lat, self.lng),
    map: map,
    icon: image,
    title: self.name
  });
  self.marker = marker;
}

/**
 * @class MapViewModel
 * @description Represents the ViewModel here
 */
function MapViewModel() {
  var self = this;
  self.address = ko.observable("sydney, NSW");
  self.query = ko.observable('');
  self.markerList = ko.observableArray();
  self.geocoder = new google.maps.Geocoder();
  self.count = 0;
  self.infoWindowList = [];
  self.locationListArray = ko.observableArray();
/**
 * @function listOfLocations
 * @description Binds with the form element. Used for retrieving information from Yelp API for each location submission
 */
  self.listOfLocations = function() {
    if (self.locationListArray().length !== 0) {//set the locationListArray to empty for every new address search.
      self.locationListArray().length = 0;
    }
    self.getYelpData(self.address()); //call Yelp API for retrieving list of locations and their information for further display
  };
/**
 * @function animateMarkers
 * @description For every list item clicked on the display, corresponding marker is bounced along with an infowindow 
 * represting information about the marker.
 * @param {number} index : Get the index of the list item clicked
 */
  self.animateMarkers = function(index) {
    var infowindow = new google.maps.InfoWindow();
    var infoContent = '<div><h5>' + self.locationListArray()[index].name +
      '</h5>' + '<img src=' + self.locationListArray()[index].rating_img +
      '><br>' + self.locationListArray()[index].phone + '</div>';
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
/**
 * @function displayMarker
 * @description Sets the marker visible during dynamic live search/filter
 */
  self.displayMarker = function() {
    self.markerList().forEach(function(marker) {
      marker.setVisible(true);
    });
  };

/**
 * @function searchFilter
 * @description Dynamic live search filter method. searchFilter is a computed observable that keeps the view and viewmodel in sync during the search process
 */
  self.searchFilter = ko.computed(function() {
    var filter = self.query().toLowerCase();
    if (!filter) {
      self.displayMarker();
      return self.locationListArray();
    } else {
      return ko.utils.arrayFilter(self.locationListArray(), function(point) {
        for (var i = 0; i < self.markerList().length; i++) {
          if (self.markerList()[i].title.toLowerCase().indexOf(filter) !== -1) {
            self.markerList()[i].setVisible(true);
          } else {
            self.markerList()[i].setVisible(false);
          }
        }
        return point.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0;
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
    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, consumer_secret, token_secret);
    parameters.oauth_signature = encodedSignature;
    var settings = {
      url: yelp_url,
      data: parameters,
      cache: true, 
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      success: function(results) {
        
        map = new google.maps.Map(document.getElementById('map'), {
          center: {
            lat: results.region.center.latitude,
            lng: results.region.center.longitude
          },
          zoom: 12
        });
        for (var i = 0; i < results.businesses.length; i++) {
          self.locationListArray.push(new Location(results.businesses[i].name,
            results.businesses[i].location.coordinate.latitude, results.businesses[
              i].location.coordinate.longitude, results.businesses[i].phone,
            results.businesses[i].image_url, results.businesses[i].rating,
            results.businesses[i].rating_img_url_small, results.businesses[i].location
            .display_address[0], results.businesses[i].location.display_address[
              1], results.businesses[i].categories[0][0]));
          self.markerList.push(self.locationListArray()[i].marker);
        }
      },
      fail: function(xhr, status, error) {
        console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
      }
    };
    $.ajax(settings);
  };
}
/**
 * @function startApp
 * @description callback function that loads once google Maps is ready
 */
function startApp() {
  initMap();
  ko.applyBindings(new MapViewModel());
}