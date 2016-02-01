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
  
  //Resize the map for responsive design consideration
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
function Location(name, lat, lng, phone, img_url, rating, rating_img, addr1,addr2, category, snippet,review_url) {
  var self = this;
  self.name = name;
  self.lat = lat;
  self.lng = lng;
  self.phone = phone; //ERROR TO FIX:if value not available, display NA
  self.img_url = img_url;
  self.rating = rating;
  self.rating_img = rating_img;
  self.addr1 = addr1;
  self.addr2 = addr2;
  self.category = category;
  self.snippet = snippet;
  self.review_url = review_url;
  self.typeVisible = ko.observable(false);
  self.nameVisible = ko.observable(true);
 
  self.showTypeLink = function() {
      self.typeVisible(!self.typeVisible());
      self.nameVisible(!self.nameVisible());
    };

  self.showNameLink = function() {
      self.typeVisible(!self.typeVisible());
      self.nameVisible(!self.nameVisible());
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
  self.animateMarkers = function(data) { 
    
    //get the index number of the list item clicked.
    var index;
     
      for(var i = 0, len = self.locationListArray().length; i < len; i++) {
      if (self.locationListArray()[i].name === data.name) {
        index = i;
        break;
      }
    }
   
    var url = 'http://api.openweathermap.org/data/2.5/weather?lat='+self.locationListArray()[index].lat+'&lon='+self.locationListArray()[index].lng+'&appid=44db6a862fba0b067b1930da0d769e98';
    
    var settings = {
      url: url, 
      dataType: 'jsonp',
      success: function(results) {
       
       self.weatherIcon = results.weather[0].icon;
       self.infowindow = new google.maps.InfoWindow;
  
      self.markerList()[i].setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){self.markerList()[i].setAnimation(null); }, 1400);
      self.infocontent = '<img src="http://openweathermap.org/img/w/'+self.weatherIcon+'.png">'+'<p>'+self.locationListArray()[i].name+'</p>';
      self.infowindow.setContent(self.infocontent);
      self.infowindow.open(map, self.markerList()[i])
      //setTimeout(function() {self.infowindow.open(null);}, 750);
     self.infoWindowList.push(self.infowindow);
    //close previously open infowindow
    if (self.count > 0) {
      self.infoWindowList[self.count - 1].close();
    }
    self.count = self.count + 1;
       

      },
      fail: function(xhr, status, error) {
        console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
      }
    };
    $.ajax(settings);
  
     
     
  };
  


/**
 * @function searchFilter
 * @description Dynamic live search filter method. searchFilter is a computed observable that keeps the view and viewmodel in sync during the search process
 */
  self.searchFilter = ko.computed(function() {
    var filter = self.query().toLowerCase();
    if (!filter) {
     /* self.locationListArray().forEach(function(mk) {
      mk.marker.setVisible(true);
      });*/
      return self.locationListArray();
    } else {

      return ko.utils.arrayFilter(self.locationListArray(), function(loc) {
        /*for (var i = 0; i < self.locationListArray().length; i++) {
          if (self.locationListArray()[i].marker.title.toLowerCase().indexOf(filter) !== -1) {
            self.locationListArray()[i].marker.setVisible(true);
          } else {
            self.locationListArray()[i].marker.setVisible(false);
          }
        }*/
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
    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, consumer_secret, token_secret);
    parameters.oauth_signature = encodedSignature;
    var settings = {
      url: yelp_url,
      data: parameters,
      cache: true, 
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      success: function(results) {
        console.log(results);
        
        map = new google.maps.Map(document.getElementById('map'), {
          center: {
            lat: results.region.center.latitude,
            lng: results.region.center.longitude
          },
          zoom: 12
        });

        map.panBy(-200, 90);
        for (var i = 0; i < results.businesses.length; i++) {
          self.locationListArray.push(new Location(results.businesses[i].name,
            results.businesses[i].location.coordinate.latitude, results.businesses[
              i].location.coordinate.longitude, results.businesses[i].phone,
            results.businesses[i].image_url, results.businesses[i].rating,
            results.businesses[i].rating_img_url_small, results.businesses[i].location
            .display_address[0], results.businesses[i].location.display_address[
              1], results.businesses[i].categories[0][0],results.businesses[i].snippet_text,results.businesses[i].url));

    //Change marker icons based on their category
  var image;
  if (results.businesses[i].categories[0][0] === 'Zoos') {
    image = 'images/zoo.png';
  } else if (results.businesses[i].categories[0][0] === 'Aquariums') {
    image = 'images/fish.png';
  } else if (results.businesses[i].categories[0][0] === 'Botanical Gardens') {
    image = 'images/garden.png';
  } else {
    image = 'images/parks.png';
  }


      var marker;
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(self.locationListArray()[i].lat, self.locationListArray()[i].lng),
    map: map,
    icon: image,
    title: self.locationListArray()[i].name
  });

    self.markerList.push(marker);
    
          
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
 * @description callback function that is executed once google Maps asynchronous load is ready
 */
function startApp() {
  initMap();
  ko.applyBindings(new MapViewModel());
}