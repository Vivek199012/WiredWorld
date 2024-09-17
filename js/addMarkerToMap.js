function addMarkerToMap(data, markers) {

    if (data.dropouts && data.dropouts.toLowerCase() === "yes") {
      return;
    }

    if (data.latitude && data.longitude) {
      let link =
        data.airbnbLink ||
        data.vrboLink ||
        data.flatioLink ||
        data.nomadstaysLink ||
        data.nomadicoLink ||
        data.dtravelLink ||
        "";

      // Check if it's a Flatio link and add the affiliate part
      if (link === data.flatioLink) {
        link += "?af=thewirednomad";
      }

      let pingOrJitterText = data.nomadstaysLink ? "Jitter" : "Ping";
      let speedValue = data.nomadstaysLink ? data.jitterSpeed : data.pingSpeed;

      let marker = L.marker([data.latitude, data.longitude]).bindPopup(`
          <b>${getLinkPrefix(data, link)}<a href="${link}" target="_blank">${data.city}/${data.country}</a></b><br>
          Download: ${data.downloadSpeed} Mbps<br>
          Upload: ${data.uploadSpeed} Mbps<br>
          ${pingOrJitterText}: ${speedValue} ms
      `);

      markers.addLayer(marker);
      // Add click event listener to the marker
      marker.on("click", function () {

        if (history.pushState) {
          //this is to get rid of the query params in the URL so we can get a nice looking unique url for each listing with the hash
          var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.pushState({path:newurl},'',newurl);
      }
        window.location.hash = data.id; // Update URL hash
      });
    }
  }
