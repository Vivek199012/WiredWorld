var backendUrl = "https://us-central1-thewirednomad.cloudfunctions.net/";
//var backendUrl = "https://cors-anywhere.herokuapp.com/https://us-central1-thewirednomad.cloudfunctions.net/";


const loadingIndicator = document.getElementById("loading-indicator");
const loadingIndicator2 = document.getElementById("loading-indicator2");
const loadingIndicator3 = document.getElementById("loading-indicator-listings");
const loadingIndicator4 = document.getElementById("loading-speed-tests");



$(document).ready(function () {
  // function detectIOS() {
  //   const userAgent = window.navigator.userAgent;
  //   const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  //   const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  //
  //   return isIOS && isSafari;
  // }
  //
  // if (detectIOS()) {
  //   alert("Map not fully supported on Safari iOS");
  // }

      // for when someone does a listings search from the homge page
      //this function will set all the view.html form fields to the values of the query params
      function setSearchFormValuesBasedOnQueryParams() {
          var queryParams = getQueryParams();
          // console.log("queryParams before parsing: ", queryParams);
          var jsonString = queryParams.platforms;
          var jsonObject = JSON.parse(jsonString);
          queryParams.platforms = jsonObject;
          // console.log("queryParams after parsing into an object: ", queryParams);

          // Set the search bar values based on the query params
          document.getElementById("city").value = queryParams.city;
          document.getElementById("country").value = queryParams.country;
          document.getElementById("min-download").value = queryParams.minDownload;
          document.getElementById("min-upload").value = queryParams.minUpload;
          document.getElementById("airbnb").checked = queryParams.platforms.airbnb;
          document.getElementById("nomadstays").checked = queryParams.platforms.nomadstays;
          document.getElementById("flatio").checked = queryParams.platforms.flatio;
          document.getElementById("nomadico").checked = queryParams.platforms.nomadico;
          document.getElementById("dtravel").checked = queryParams.platforms.dtravel;

       }



  function openPopup(url) {
    // Create a Bootstrap modal element
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
      <div class="modal-dialog modal-lg"> <!-- Use modal-lg for larger modals -->
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Website</h5>
            <button type="button" class="close" data-dismiss="modal">&times;</button>
          </div>
          <div class="modal-body">
            <div id="modal-content-container" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </div>
    `;

    // Append the modal to the document
    document.body.appendChild(modal);

    // Initialize the Bootstrap modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Fetch the content from the URL and inject it into the modal
    const modalContentContainer = document.getElementById("modal-content-container");

    // You can use the Fetch API to retrieve content from the URL
    fetch(url)
      .then(response => response.text())
      .then(content => {
        modalContentContainer.innerHTML = content;
      })
      .catch(error => {
        console.error("Error fetching content:", error);
        modalContentContainer.innerHTML = "Failed to load content.";
      });
  }

  // Set default checkbox states only if the checkboxes exist on the page
  const flatioCheckbox = document.getElementById("flatio");
  const verifiedCheckbox = document.getElementById("verified");

  document.getElementById('verifiedSliderInDropdownMenu').addEventListener('click', function(event) {
    event.stopPropagation(); // Stop event propagation to prevent dropdown from closing
});


  if (flatioCheckbox && verifiedCheckbox) {
    flatioCheckbox.checked = true;
    verifiedCheckbox.checked = false;
  }
    //document.getElementById('airbnb').checked = true;
    //document.getElementById('vrbo').checked = true;
  // Get all checkboxes on the page
  let allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

  // Loop through all checkboxes and uncheck any that aren't airbnb or vrbo
  for (let checkbox of allCheckboxes) {
    if (checkbox.id !== "flatio") {
      checkbox.checked = false;
    }
  }
  // Minimal Firebase config
  const minimalConfig = {
    projectId: "thewirednomad", // Only your project ID should be safe to expose
  };

  // Initialize Firebase with minimal config
  firebase.initializeApp(minimalConfig);

  // Check if there are any query params - if there are, set the search form values to those values
  if (window.location.search) {
    setSearchFormValuesBasedOnQueryParams();
  }

  loadAppCode(); //calls fetchDatafromFirestore() which returns a promise
  //it will also use the search form values to filter the listings and create markers



  // document
  //   .getElementById("toggle-advanced-search")
  //   .addEventListener("click", function (event) {
  //     event.preventDefault();
  //     const advancedSearch = document.getElementById("advanced-search");
  //     advancedSearch.style.display =
  //       advancedSearch.style.display === "none" ? "block" : "none";
  //   });

  // Assuming you have an element with class "verified-icon" for the verified icon
  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("verified-icon")) {
      const url = event.target.getAttribute("data-link") || "";
      if (url) {
        // Open the URL in a new window
        window.open(url, '_blank');
      }
    }
  });

// Assuming you have an element with class diamond "verified-icon" for the verified icon
document.getElementById("listing-container").addEventListener("click", function (event) {
  // Get the closest ancestor with class 'badge' if clicked element is inside it
  var badgeElement = event.target.closest('.badge[data-document-id]');

  if (badgeElement) {
    // Extract the document ID from the data attribute
    var documentId = badgeElement.getAttribute('data-document-id');

    // Perform the desired action with the document ID
    console.log("Document ID:", documentId);

    // Set loading state to true
    loadingIndicator4.style.display = "block";

    // Call the Cloud Function to get the hostName
    fetch(
      backendUrl + `getHostName?documentId=${documentId}`,
      {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    })
      .then(response => response.json())
      .then(data => {
        // Retrieve the hostName from the Cloud Function response
        const hostName = data.hostName;

        // Construct the collectionName
        const collectionName = `${hostName}-speeds`;

        // Call the Cloud Function to get totalDropoutsLast24Hours
        fetch(
          backendUrl + `getTotalDropoutsLast24Hours?hostName=${hostName}`,
          {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        })
          .then(response => response.json())
          .then(data => {
            // Retrieve the totalDropoutsLast24Hours from the Cloud Function response
            const totalDropoutsLast24Hours = data.totalDropoutsLast24Hours;

            // Do something with totalDropoutsLast24Hours, e.g., display it in the UI
            console.log('Total Dropouts Last 24 Hours:', totalDropoutsLast24Hours);

            // Construct the URL with the collectionName
            const url = `/react-app/index.html?${collectionName}`;

            // Open React app in a new tab
            const reactAppWindow = window.open(url, "_blank");

            // Load React's CSS
            var reactCSS = reactAppWindow.document.createElement("link");
            reactCSS.rel = "stylesheet";
            reactCSS.href = "/react-app/static/css/main.e6c13ad2.css";
            reactAppWindow.document.head.appendChild(reactCSS);

            // Load React's JS
            var reactJS = reactAppWindow.document.createElement("script");
            reactJS.src = "/react-app/static/js/main.cc72493a.js";
            reactAppWindow.document.body.appendChild(reactJS);

            // Introduce a delay before sending postMessage
            setTimeout(function () {
              // Set loading state to false
              loadingIndicator4.style.display = "none";

              // Send the collection name and totalDropoutsLast24Hours to the opened React app
              console.log("Sending postMessage with collectionName and totalDropoutsLast24Hours:", collectionName);
              reactAppWindow.postMessage({
                type: "speedTestData",
                collectionName,
                totalDropoutsLast24Hours,
              }, "*");
              console.log("postMessage sent");
            }, 1500); // You can adjust the delay duration as needed
          })
          .catch(error => {
            // Set loading state to false in case of an error
            loadingIndicator.style.display = "none";
            console.error('Error fetching totalDropoutsLast24Hours:', error);
          });
      })
      .catch(error => {
        // Set loading state to false in case of an error
        loadingIndicator4.style.display = "none";
        console.error('Error fetching hostName:', error);
      });
  }
});


  // Ensure Firebase is initialized here
  const getStatsCounts = firebase.functions().httpsCallable("getStatsCounts");

  getStatsCounts()
    .then((result) => {
      document.getElementById("totalListings").innerText =
        result.data.totalListings || 0;
      document.getElementById("totalCountries").innerText =
        result.data.totalCountries || 0;
    })
    .catch((error) => {
      console.error("Error fetching stats:", error);
    });

});
