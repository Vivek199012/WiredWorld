autoComplete(document.getElementById("mainsearch"), getAllItems(), "home");

var allCities = [];
var allCountries = [];

let backendUrl = "https://us-central1-thewirednomad.cloudfunctions.net/getCitiesAndCountries";
//let backendUrl = "https://cors-anywhere.herokuapp.com/https://us-central1-thewirednomad.cloudfunctions.net/getCitiesAndCountries";


fetch(
  backendUrl,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: 'cors', // Important: Set the mode to cors
  }
)
  .then((response) => response.json())
  .then((data) => {
      // Check if data.cities and data.countries are arrays
      if (Array.isArray(data.cities)) {
        allCities = data.cities;
      } else {
        console.error("Invalid data format for cities");
      }

      if (Array.isArray(data.countries)) {
        allCountries = data.countries;
      } else {
        console.error("Invalid data format for countries");
      }

      let allItemsUpdated = allCities.concat(allCountries);
      console.log("allItemsUpdated", allItemsUpdated); // Correct variable name

      // Ensure autoComplete function exists and is correctly implemented
      if (typeof autoComplete === 'function') {
        autoComplete(document.getElementById("mainsearch"), allItemsUpdated, "home");
      } else {
        console.error("autoComplete function is not defined");
      }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

//to handle the main search bar submission
$(document).ready(function() {

  // Handle form submission
  $('#mainsearchform').submit(function(event) {
    event.preventDefault(); // Prevent the default form submission

    console.log("mainsearchform submitted");

    let platforms = {};
    // Collect selected platforms
    $('.platformsDropdownAndInput .dropdown-menu input[type="checkbox"]').each(function() {
      platforms[$(this).attr('id')] = $(this).is(":checked");
    });

    let criteria = {};
    let mainSearchValue = $('#mainsearch').val().toString().trim();
    console.log("mainsearch", mainSearchValue);

    if (allCountries.includes(mainSearchValue)) {
      criteria.city = "";
      criteria.country = mainSearchValue;
    } else {
      criteria.city = mainSearchValue;
      criteria.country = "";
    }

    criteria.minDownload = $('#min-download').val().toString();
    criteria.minUpload = $('#min-upload').val().toString();
    criteria.platforms = platforms;

    console.log("criteria in homePage.js", criteria);

    var platformsJSON = JSON.stringify(criteria.platforms);

    var url = "view.html" +
      "?city=" + encodeURIComponent(criteria.city) +
      "&country=" + encodeURIComponent(criteria.country) +
      "&minDownload=" + encodeURIComponent(criteria.minDownload) +
      "&minUpload=" + encodeURIComponent(criteria.minUpload) +
      "&platforms=" + encodeURIComponent(platformsJSON);

    // Redirect to view.html with query parameters
    window.location.href = url;

  });
});
