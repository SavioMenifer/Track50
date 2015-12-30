/**
 * Requires and UI items
 */

var Light = require('ui/light');
var UI = require('ui');
var Vector2 = require('vector2');
var Settings = require('settings');
var ajax = require('ajax');

var menu = new UI.Menu();
var eventsCard = new UI.Card();
var card = new UI.Card();

/**
 * Data storage and strings
 */

var packages = JSON.parse(localStorage.getItem('packages')) || [];

var statuses = {
  'ERROR': 'Error',
  'UNKNOWN': 'Unknown status',
  'TRANSIT': 'In transit',
  'DELIVERED': 'Delivered',
  'RETURNED': 'Package returned',
  'FAILURE': 'Failed delivery attempt'
};

var carriers = {
  'usps': 'USPS',
  'fedex': 'FedEx',
  'ups': 'UPS',
  'dhl_express': 'DHL Express',
  'canada_post': 'Canada Post'
}

/**
 * Main
 */

console.log('Up and running!');
showMenu();
setMenuCallbacks();
updateAllPackages();

/**
 * Pebble config page events
 */

Settings.config(
  { url: 'http://packagetracker.pixelblenders.com' },
  function(e) {
    console.log('Config page closed.');
    updateStorage(e.options);
    updateNewPackages();
    // Clearing menu items
    menu.section(0, { title: 'Packages' });
    menu.items(0, [{ title: 'No packages' }]);
    refreshMenu();
    if (packages.length === 0) {
      showCard('Hooray!', 'This was CS50!\nThank you all!');
    }
    else {
      menu.show();
    }
  }
);

/**
 * UI Functions
 */

function showMenu() {
  if (packages.length === 0) {
    showCard('Hello!', 'You haven\'t added any packages yet. Use the config page on your phone to add packages.');
    return;
  }
  menu.section(0, { title: 'Packages' });
  refreshMenu();
  menu.show();
}

function refreshMenu() {
  for (var i = 0; i < packages.length; i++) {
    menu.item(0, i, {
      title: packages[i].name,
      subtitle: (packages[i].status === undefined) ? 'Getting info...' : statuses[packages[i].status]
    });
  }
}

function showEvents(index) {
  if (packages[index].status_long === undefined) {
    showCard('Oops!', 'This package could not be tracked. Check the tracking number or try again later.\n' + packages[index].code);
    return;
  }
  eventsCard.title(packages[index].name);
  eventsCard.subtitle(carriers[packages[index].carrier]);
  eventsCard.body(
    packages[index].code + '\n' + 
    packages[index].status_long + '\n' +
    packages[index].location + '\n' +
    packages[index].timestamp
  );
  eventsCard.style('small');
  eventsCard.scrollable(true);
  eventsCard.show();
}

function showCard(title, body) {
  card.title(title);
  card.body(body);
  card.style('small');
  card.scrollable(true);
  card.show();
}

/**
 * Callback functions
 */

function setMenuCallbacks() {
  menu.on('select', function(e) {
    console.log('Package selected: ' + e.item.title);
    showEvents(e.itemIndex);
  });
  menu.on('longSelect', function(e) {
    console.log('Package long selected: ' + e.item.title);
    updatePackage(e.itemIndex);
  });  
}

/**
 * Package management functions
 */

// Updates package array and localStorage with new items from config response
function updateStorage(response) {
  var to_keep = [];

  // Adding new packages
  for (var i = 0; i < response.length; i++) {
    var item = response[i];
    var found = packages.some(function (el) { return el.id === item.id; });
    if (!found) {
      packages.unshift({id: item.id, code:item.code, name: item.name, carrier: item.carrier});
      console.log('Added package: ' + item.name);
    }
    to_keep.push(item.id);
  }
  
  // Deleting unwanted packages
  for(i = 0; i < packages.length; i++) {
    var item = packages[i];
    if(to_keep.indexOf(item.id) === -1) {
      packages.splice(i, 1);
      i--;
      console.log('Deleted package: ' + item.name);
    }
  }

  localStorage["packages"] = JSON.stringify(packages);
}

// Updates status of package in packages[] array
function updatePackage(index) {
  ajax(
    {
      url: 'https://api.goshippo.com/v1/tracks/' + packages[index].carrier + '/' + packages[index].code,
      type: 'json'
    },
    function(data, status, request) {
      if (data.tracking_status === null) {
        console.log('Package status unknown: ' + packages[index].name);
        packages[index].status = 'UNKNOWN';
      }
      else {
        packages[index].status = data.tracking_status.status;
        packages[index].status_long = data.tracking_status.status_details;
        packages[index].location = getLocation(data.tracking_status.location);
        packages[index].timestamp = getTimestamp(data.tracking_status.status_date);
        console.log('Updated package: ' + packages[index].name);
      }
      localStorage["packages"] = JSON.stringify(packages);
      refreshMenu();
    },
    function(error, status, request) {
      packages[index].status = 'ERROR';
      refreshMenu();
      console.log('Update request failed: ' + error);
    }
  );
}

function updateAllPackages() {
  for (var i = 0; i < packages.length; i++) {
    updatePackage(i);
  }
}

function updateNewPackages() {
  for (var i = 0; i < packages.length; i++) {
    if (packages[i].status === undefined) {
      updatePackage(i);
    }
  }
}

function getLocation(location) {
  if (location === null) {
    return 'Location not available.';
  }
  else{
    return location.city + ', ' + location.state;
  }
}

function getTimestamp(isoDate) {
  if (isoDate === null) {
    return 'Date not available.';
  }
  var date = new Date(isoDate);
  return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
}
