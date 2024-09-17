
    function getSearchCriteria(slider) {

        // console.log("getSearchCriteria called")

        let city = document.getElementById("city").value.trim() || "";
        let country = document.getElementById("country").value.trim() || "";
        let minDownload = document.getElementById("min-download").value.trim() || "";
        let minUpload = document.getElementById("min-upload").value.trim() || "";
        let maxPing = document.getElementById("max-ping").value.trim() || "";
        let openLanPorts = document.getElementById("open-lan-ports").checked || false;
        let minPrice = 0;
        // let maxPrice = Number.MAX_SAFE_INTEGER;
        let maxPrice = 1000
        let includeVerified = document.getElementById("verified").checked || false;

        if (slider && slider.noUiSlider) {
          const priceValues = slider.noUiSlider.get();
          minPrice = priceValues[0];
          maxPrice = priceValues[1];
        }

        // Get the checkbox values
        let airbnbChecked = document.getElementById("airbnb").checked;
        let nomadstaysChecked = document.getElementById("nomadstays").checked;
        let flatioChecked = document.getElementById("flatio").checked;
        let nomadicoChecked = document.getElementById("nomadico").checked;
        let dtravelChecked = document.getElementById("dtravel").checked;

        return {
          city,
          country,
          minDownload,
          minUpload,
          maxPing,
          openLanPorts,
          minPrice,
          maxPrice,
          includeVerified,
          platforms: {
            // You can add more platforms similarly
            airbnb: airbnbChecked,
            nomadstays: nomadstaysChecked,
            flatio: flatioChecked,
            nomadico: nomadicoChecked,
            dtravel: dtravelChecked
          },
        };
      }


    function clearSearchCriteria(slider) {
        // Clear input fields
        document.getElementById("city").value = "";
        document.getElementById("country").value = "";
        document.getElementById("min-download").value = "";
        document.getElementById("min-upload").value = "";
        document.getElementById("max-ping").value = "";
        document.getElementById("verified").checked = false;

        // Reset price slider
        if (slider && slider.noUiSlider) {
          slider.noUiSlider.reset();
        }

        // Clear checkboxes
        document.getElementById("airbnb").checked = false;
        document.getElementById("nomadstays").checked = false;
        document.getElementById("flatio").checked = false;
        document.getElementById("nomadico").checked = false;
        document.getElementById("dtravel").checked = false;

    }
