var carriers = {
  "usps": "USPS",
  "fedex": "FedEx",
  "ups": "UPS",
  "dhl_express": "DHL Express",
  "canada_post": "Canada Post"
}

$(document).ready(function() {
  var packages = [];
  var deleteButton = "<button class='delete btn btn-warning pull-right'>Delete</button>";

  // Populating list of packages
  $("#info").remove(); 
  if (localStorage.getItem("packages") === null || localStorage.getItem("packages") === "[]") {
    $("#list").append("<p id='info' class='text-muted'>No packages added</p>");
  }
  else {
    packages = JSON.parse(localStorage["packages"]);
    for (var i = 0; i < packages.length; i++) {
      $(".list_of_packages").prepend("<li class='list-group-item clearfix' id='" + packages[i]['id'] + "'>" + "<div class='text_holder'>" + packages[i]['name'] + "<span class='text-muted'> &mdash; " + packages[i]['code'] + ", " + carriers[packages[i]['carrier']] + "</span>" + deleteButton + "</div></li>");
    }
  }

  // Add new item
  $("form#add_box").submit(function(event) {
    event.preventDefault();
    if (requiredFieldEmpty()) {
      return false;
    }

    // Unique ID for each list item
    var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    var uniqID = randLetter + Date.now();

    $("#info").remove();
    $(".list_of_packages").prepend("<li class='list-group-item clearfix new' id='" + uniqID + "'>" + "<div class='text_holder'>" + $("#name").val() + "<span class='text-muted'> &mdash; " + $("#code").val().toUpperCase() + ", " + $('#carrier :selected').text() + "</span>" + deleteButton + "</div></li>");
    $(".new").focus();
    $(".new").removeClass('new');

    // Adding item to localStorage
    packages.push({id: uniqID, name: $("#name").val(), code: $("#code").val().toUpperCase(), carrier: $("#carrier").val()});
    localStorage["packages"] = JSON.stringify(packages);

    $("#name").val('');
    $("#code").val('');
    $("#carrier").val('none');
  });

  // Delete an item
  $(".list_of_packages").on("click", "button.delete", function() {
    var deleteID = $(this).closest("li").attr('id');
    packages = packages.filter(function (el) { return el.id !== deleteID; });
    localStorage["packages"] = JSON.stringify(packages);
    $(this).closest("li").remove();
    if (packages.length == 0){
      $("#list").append("<p id='info' class='text-muted'>No packages added</p>");
    }
  });

  // Send to pebble
  $("form#save_box").submit(function(event) {
    event.preventDefault();
    location.href = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(packages));
  });
});

function requiredFieldEmpty() {
  var empty = false;
  if ($.trim($("#name").val()) === "") {
    $("#nameForm").addClass("has-error");
    empty = true;
  }
  else {
    $("#nameForm").removeClass("has-error");
  }
  if ($.trim($("#code").val()) === "") {
    $("#codeForm").addClass("has-error");
    empty = true;   
  }
  else {
    $("#codeForm").removeClass("has-error");
  }
  if ($("#carrier").val() === null) {
    $("#carrierForm").addClass("has-error");
    empty = true;   
  }
  else {
    $("#carrierForm").removeClass("has-error");
  }
  return empty;
}
