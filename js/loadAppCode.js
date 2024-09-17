var backendUrl = "https://us-central1-thewirednomad.cloudfunctions.net/";
//var backendUrl = "https://cors-anywhere.herokuapp.com/https://us-central1-thewirednomad.cloudfunctions.net/";

//Change this back to you public key since this one is mine
var mapboxAccessToken = "pk.eyJ1IjoiaDBub28iLCJhIjoiY2xwcHY2Z3p2MHV5MTJpcHA1eDdkNWQwaiJ9.jZL702vNP1sO1frHitHJ8w";

let slider;

function loadAppCode() {

    let isSearchOperation = false;
    let previousSearchCriteria = null;
    let slider;

    if (
      window.location.pathname !== "/submit.html" &&
      window.location.pathname !== "/vpn.html" &&
      window.location.pathname !== "/about.html"
    ) {
      // Check if there is a hash in the URL on page load
      if (window.location.hash) {
        locationPage();
      }
      getMaxPrice();
      fetchDataFromFirestore();
    }

      function fetchDataFromFirestore(criteria) {
        if (window.location.hash && !isSearchOperation) {
            loadingIndicator2.style.display = "none";
            loadingIndicator3.style.display = "none";
            return; // Skip fetch if there is a hash and not a search operation
        }

        //this criteria parameter is not being used^
        //we could save processing power by only loading listings after a search
        //but if we did that, we'd have to get the cities and countries for the search autocomplete another way

        // console.log("fetchDataFromFirestore called with criteria: ", criteria);

        return new Promise((resolve, reject) => {
          if (!isSearchOperation) {
            loadingIndicator2.style.display = "block";
            loadingIndicator3.style.display = "block";
          }

          // Fetch data using a Cloud Function
          fetch(
            backendUrl + "getFeedbacks",
            {
              method: "POST",
              body: JSON.stringify({ criteria: null }),
              headers: { "Content-Type": "application/json" },
              mode: 'cors', // Important: Set the mode to cors
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.json();
            })
            .then((data) => {
              console.log("Loaded ", data.length, " listings");

              //get all cities and countries to use in the autocomplete search bar
              const allCities = [];
              const allCountries = [];
              for (let i = 0; i < data.length; i++) {
                  if (!allCities.includes(data[i].city)) {
                    allCities.push(data[i].city);
                  }
                  if (!allCountries.includes(data[i].country)) {
                    allCountries.push(data[i].country);
                  }
              }
              //this autoComplete function is defined in the utils.js file
              autoComplete(document.getElementById("city"), allCities);
              autoComplete(document.getElementById("country"), allCountries);

              // Reset all batchs information and current batch index
              allBatches = [];
              currentBatchIndex = 0;

              // Sort data based on the priority of links
              data.sort(prioritizeLinks);
              let criteria = getSearchCriteria(slider);

              ///////need to sort the airbnbs by rating (only airbnbs have ratings)
              // Filter out entries that have an airbnbLink
              let airbnbListings = data.filter(entry => {
                  //console.log("entry: ", entry);
                  if (!entry.airbnbLink) {
                    return false;
                  }

                  if (!entry.rating) {
                    entry.rating = -1; // Set the rating to -1 if it's missing

                    return true;
                  }

                  entry.rating = parseFloat(entry.rating);

                  if (isNaN(entry.rating)) {
                    entry.rating = -1;
                    return true;
                  }

                  return true;
              });
              // Sort the filtered Airbnb listings by the 'rating' attribute in descending order
              airbnbListings.sort((a, b) => b.rating - a.rating);
              // Remove the Airbnb listings from the original list
              data = data.filter(entry => !entry.airbnbLink);
              // Re-append the sorted Airbnb listings back to the original list
              data = data.concat(airbnbListings);
              ///////done sorting airbnbs

              // Here we initialize the current batch
              let currentBatch = [];

              console.log("adding markers to map")
              data.forEach((entry) => {
                // console.log("entry: ", entry);
                if (criteria == null || meetsCriteria(entry, criteria)) {
                  if (
                    (criteria.platforms.airbnb && "airbnbLink" in entry) ||
                    (criteria.platforms.nomadstays && "nomadstaysLink" in entry) ||
                    (criteria.platforms.flatio && "flatioLink" in entry) ||
                    (criteria.platforms.nomadico && "nomadicoLink" in entry) ||
                    (criteria.platforms.dtravel && "dtravelLink" in entry)
                  ) {
                    // Add the entry to the current batch
                    currentBatch.push(entry);
                    // If the batch size is 15, push the current batch to allBatches and reset currentBatch
                    // Only create listing elements for the first batch
                    if (allBatches.length === 0) {
                      createListingElement(entry, listingContainer);
                    }
                    addMarkerToMap(entry, markers);

                    if (currentBatch.length === 15) {
                      allBatches.push(currentBatch);
                      currentBatch = [];
                    }
                  }
                }
              });

              // After the loop, push the last batch if it's not empty
              if (currentBatch.length > 0) {
                allBatches.push(currentBatch);
              }

              if (allBatches.length === 0) {
                  //check if there is a hash (somone is trying to access a specific location via a link instead of via search)
                  if (!window.location.hash) {
                    listingContainer.innerHTML = "<br><br>No listings found.";
                    listingContainer.classList.add("no-results");
                  }

              }

              if (!isSearchOperation) {
                loadingIndicator2.style.display = "none";
                loadingIndicator3.style.display = "none";
              }
              resolve(); // Resolve the Promise after data handling is done
            })
            .catch((error) => {
              console.error("Error:", error);
              if (!isSearchOperation) {
                loadingIndicator2.style.display = "none";
                loadingIndicator3.style.display = "none";
              }
              reject(error); // Reject the Promise if there's an error
            });
        });
      }

    async function getMaxPrice() {
      try {
        const response = await fetch(
          backendUrl + "getMaxPrice",
            {
              method: 'GET',
              headers: {'Content-Type': 'application/json'},
              mode: 'cors', // Important: Set the mode to cors
            });
        const data = await response.json();
        slider = document.getElementById('price-range');
        slider.addEventListener('mouseup', function(event) {
          event.stopPropagation();
        });


        noUiSlider.create(slider, {
          //start: [0, data.maxPrice], // Starting values for min and max
          start: [0, 1000], // Starting values for min and max

          connect: true, // Display a colored bar between the handles
          range: {
            'min': 0,
            //'max': data.maxPrice
            'max': 1000
          }
        });

        slider.noUiSlider.on('update', function (values, handle) {
          document.getElementById("min-price-output").textContent = "$" + values[0];
          document.getElementById("max-price-output").textContent = "$" + values[1];
        });
      } catch (error) {
        console.error("Error setting up price range slider: ", error);
      }
    }

    // Display listings based on search criteria
    var searchForm = document.getElementById("search-form");
    var listingContainer = document.getElementById("listing-container");
    listingContainer.style.overflowY = "scroll";


    // Check if the map container element exists
    var mapContainer = document.getElementById("map-container");

    // Initialize Leaflet map
    var map = L.map(mapContainer, {
        zoomControl: false,
    }).setView([0, 0], 2);

    var mapboxLayer = L.tileLayer(
      "https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=" +
        mapboxAccessToken,
      {
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    // Create marker cluster group
    var markerLayers = [];
    var markers = L.markerClusterGroup().addTo(map);

    function searchForLocations(criteria = null) {

      isSearchOperation = true;
      loadingIndicator.style.display = "block";

      // Clear previous listings and markers
      listingContainer.innerHTML = ""; // Clear previous listings
      markers.clearLayers(); // Clear previous markers

      // Fetch and display listings and markers based on criteria
       // Used heroku proxy due to the cors policy to be able to fetch data
      fetch(
        backendUrl + "getListings",
        {
        method: "POST",
        body: JSON.stringify({ criteria: criteria }),
        headers: { "Content-Type": "application/json" },
        mode: 'cors', // Important: Set the mode to cors
      })
        .then((response) => response.json())
        .then((data) => {
          loadingIndicator.style.display = "none";
          return fetchDataFromFirestore(criteria);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          loadingIndicator.style.display = "none";
        });
    }



    function locationPage() {
      // Extract the locationId from the URL
      const locationId = window.location.hash.substring(1); // Remove the '#' character

      if (!locationId) {
        console.error(
          "Invalid URL, no locationId in hash:",
          window.location.href
        );
        // Handle error, e.g., redirect the user or show a 404 message
        return;
      }

      clearSearchCriteria(slider)
      // Fetch the data for this locationId using a Cloud Function
      firebase
        .functions()
        .httpsCallable("getLocationData")({ locationId })
        .then((result) => {
          const data = result.data.data;
          data.id = result.data.id; // Add the docId to the data object
          showListingDetails(data, listingContainer);

          // Adjust the view of the map
          if (data.latitude && data.longitude) {
            map.setView([data.latitude, data.longitude], 13); // 13 is the zoom level, adjust as needed

            // Add map marker
            //addMarkerToMap(data, markers);
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          // Handle the error, e.g., by showing an error message to the user
        });
    }

    $(window).on("hashchange", function () {
      const locationId = window.location.hash.substring(1); // Get ID from URL
      if (locationId) {
        locationPage();
      } else {
        console.log("No location ID. Showing default content.");
      }
    });



    //Initialize All Batches variable to store the result of the fetch
    let allBatches = [];

    //keep track of the current batch to dispatch the information by sets of 15 while scrolling
    let currentBatchIndex = 0;
    // This function will be called every time the user scrolls inside the listingContainer
    function handleInfiniteScroll() {


      // Get the current scroll position within the listingContainer
      const currentScrollPosition = listingContainer.scrollTop;
      // Get the scrollable height within the listingContainer
      const scrollableHeight = listingContainer.scrollHeight - listingContainer.clientHeight;
      // Threshold to determine when to fetch the next batch (e.g., 100px from the bottom)
      const threshold = 100;
      // Check if we're within the threshold of the bottom of the listingContainer
      if (currentScrollPosition + threshold >= scrollableHeight) {
        // Load the next batch if available
        loadNextBatch();
      }
    }

    function loadNextBatch() {
      // Check if there is a next batch
      if (currentBatchIndex < allBatches.length) {
        // Get the next batch
        const nextBatch = allBatches[currentBatchIndex];

        // Create a set to keep track of unique listing identifiers
        const uniqueListingIdentifiers = new Set();

        // Create listing elements for the first batch only
        if (currentBatchIndex > 0) {
          nextBatch.forEach((entry) => {
            // Check if the listing with this identifier already exists in the UI
            const listingIdentifier = entry.id; // Replace with the actual identifier property
            if (!uniqueListingIdentifiers.has(listingIdentifier)) {
              createListingElement(entry, listingContainer);
              uniqueListingIdentifiers.add(listingIdentifier);
            }
          });
        }

        // Increment the batch index so next time we load the following batch
        currentBatchIndex++;
      } else {
        // Optionally, handle the case where there are no more batches (e.g., show a message)
        console.log('No more listings to load.');
      }
    }

    //Reset all batchs information and current batch index
    allBatches = [];
    currentBatchIndex = 0;

    // Add the infinite scroll listener to the window's scroll event
    listingContainer.addEventListener('scroll', handleInfiniteScroll);
    var searchButton = document.getElementById("search-form");

    searchForm.addEventListener('click', async function (event) { // might need to change to 'click' instead of 'submit'
      event.preventDefault();

      console.log("Search form submitted");

      // Check if a search operation is already in progress
      if (isSearchOperation) {
        console.log("A search operation is already in progress. Please wait.");
        return;
      }

      searchForm.disabled = true;
      window.location.hash = ''; // Clear the hash to ensure fresh data fetch

      let criteria = getSearchCriteria(slider); // Get the search criteria when the form is submitted

      // Check if no platform is selected
      if (!criteria.platforms.airbnb && !criteria.platforms.nomadstays && !criteria.platforms.flatio && !criteria.platforms.nomadico && !criteria.platforms.dtravel) {
        alert("You must select a platform."); // Display a warning message
        return; // Abort the search
      }

      // Check if the criteria are the same as the previous search
      if (isSameSearchCriteria(criteria, previousSearchCriteria)) {
        console.log("Search criteria are the same as the previous search. Skipping search.");
        searchForm.disabled = false; // Re-enable the button if validation fails
        return;
      }

      isSearchOperation = true; // Indicate that a search operation is in progress

      // Clear previous listings and reset batch variables
      listingContainer.innerHTML = "";
      allBatches = [];
      currentBatchIndex = 0;

      try {
        await searchForLocations(criteria); // Call the function that performs the search
      } finally {
        // Always re-enable the button after the search finishes, even if an error occurs
        searchForm.disabled = false;
        isSearchOperation = false;
      }
    });

    // Function to trigger your Firebase Cloud Function for email notifications
    function triggerEmailNotification() {
      const functions = firebase.functions();
      const sendEmailOnNewFeedback = functions.httpsCallable(
        "sendEmailOnNewFeedback"
      );

      sendEmailOnNewFeedback()
        .then((result) => {
          console.log("Email notification triggered successfully:", result);
        })
        .catch((error) => {
          console.error("Error triggering email notification:", error);
        });
    }
  }
