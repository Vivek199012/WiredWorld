function showListingDetails(listingData, listingContainer) {

    // Clear previous listings
    listingContainer.innerHTML = "";

    let hostSubmittedTag = "";
    if (listingData.isHost) {
      hostSubmittedTag =
        '<span class="badge" style="background-color: #000000; color: white; padding: 5px; margin-bottom: 3px;">Host Submitted</span>';
    }

    let verifiedTag = "";
    if (listingData.verifiedLink) {
        verifiedTag = `
        <a href="${listingData.verifiedLink}" target="_blank" class="badge" style="background-color: #ffffff; color: #000000; border: 1px solid #000000; padding: 5px; margin-bottom: 3px; display: inline-flex; align-items: center; cursor: pointer; box-sizing: border-box; text-decoration: none;">
            Verified
            <i class="fas fa-check-circle verified-icon" style="color: #FFD700; margin-left: 2px;"></i>
        </a>`;
    }

    let diamondTag = "";
    if (listingData.diamondTag) {
        diamondTag = `
        <a href="#" data-document-id="${listingData.id}" class="badge" style="background-color: #ffffff; color: #000000; border: 1px solid #000000; padding: 5px; margin-bottom: 3px; display: inline-flex; align-items: center; box-sizing: border-box; text-decoration: none;">
            Verified
            <i class="fas fa-check-circle verified-icon" style="color: #73E5FF; margin-left: 5px;"></i>
        </span>
        </a>`;
    }



    // Create listing element
    let listingElement = document.createElement("div");
    listingElement.classList.add("listing");

    let titleElement = document.createElement("div");
    titleElement.classList.add("listing-title");

    // Create a <span> element for the link prefix
    let linkPrefixElement = document.createElement("span");

    if (listingData.hasOwnProperty("airbnbLink")) {
      // Extract the room number from the Airbnb link
      const roomNumber = listingData.airbnbLink.match(/\/rooms\/(\d+)/)[1];

      // Create an <a> element for the Airbnb link
      let airbnbLinkElement = document.createElement("a");
      airbnbLinkElement.href = listingData.airbnbLink;
      airbnbLinkElement.textContent = "Airbnb: " + roomNumber;
      airbnbLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(airbnbLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    } else if (listingData.hasOwnProperty("vrboLink")) {
      // Extract the Vrbo ID from the Vrbo link
      const vrboIDMatch = listingData.vrboLink.match(/\/([a-zA-Z0-9]+)[^\da-zA-Z]*$/);

      // Check if there's a match and extract the ID
      const vrboID = vrboIDMatch ? vrboIDMatch[1] : null;
      // Create an <a> element for the Vrbo link (only the ID as the hyperlink)
      let vrboLinkElement = document.createElement("a");
      vrboLinkElement.href = listingData.vrboLink;
      vrboLinkElement.textContent = "Vrbo: " + vrboID;
      vrboLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(vrboLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    } else if (listingData.hasOwnProperty("flatioLink")) {
      // Extract the Vrbo ID from the Vrbo link
      const flatioID = listingData.flatioLink.match(/\/([\w-]+)$/)[1];

      const flatioLinkWithAffiliate =
        listingData.flatioLink + "?af=thewirednomad";

      // Create an <a> element for the Flatio link
      let flatioLinkElement = document.createElement("a");
      flatioLinkElement.href = flatioLinkWithAffiliate;
      flatioLinkElement.textContent = "Flatio: " + flatioID;
      flatioLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(flatioLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    } else if (listingData.hasOwnProperty("nomadstaysLink")) {
      // Extract the Vrbo ID from the Vrbo link
      const nomadstaysID = listingData.nomadstaysLink.match(/\/([\w-]+)$/)[1];

      // Create an <a> element for the Vrbo link (only the ID as the hyperlink)
      let nomadstaysLinkElement = document.createElement("a");
      nomadstaysLinkElement.href = listingData.nomadstaysLink;
      nomadstaysLinkElement.textContent = "NomadStays: " + nomadstaysID;
      nomadstaysLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(nomadstaysLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    } else if (listingData.hasOwnProperty("nomadicoLink")) {
      // Extract the Vrbo ID from the Vrbo link
      const nomadicoID = listingData.nomadicoLink.split("www.nomadico.io/")[1];
      const nomadicoHome = listingData.home;
      // Create an <a> element for the Vrbo link (only the ID as the hyperlink)
      let nomadicoLinkElement = document.createElement("a");
      nomadicoLinkElement.href = listingData.nomadicoLink;
      nomadicoLinkElement.textContent = "Nomadico: (" + nomadicoHome + ")";
      nomadicoLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(nomadicoLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    } else if (listingData.hasOwnProperty("dtravelLink")) {
      const dtravelID = listingData.dtravelLink.split('://')[1].split('.dtravel.com/property')[0];
      // Create an <a> element for the Dtravel link (only the ID as the hyperlink)
      let dtravelLinkElement = document.createElement("a");
      dtravelLinkElement.href = listingData.dtravelLink;
      dtravelLinkElement.textContent = "Dtravel: " + dtravelID;
      dtravelLinkElement.target = "_blank"; // Open link in a new tab
      linkPrefixElement.appendChild(dtravelLinkElement);
      // Insert a line break before adding the host tag
      linkPrefixElement.insertAdjacentHTML("beforeend", "<br>");

      if (listingData.isHost) {
        linkPrefixElement.innerHTML += hostSubmittedTag;
      }
    }

    titleElement.appendChild(linkPrefixElement);
    let pingOrJitterText = listingData.nomadstaysLink ? "Jitter" : "Ping";
    let speedValue = listingData.nomadstaysLink ? listingData.jitterSpeed : listingData.pingSpeed;

    let detailsElement = document.createElement("div");
    detailsElement.classList.add("listing-details");
    detailsElement.innerHTML = `
    <div class="verified-tag-row">
        ${verifiedTag}
        ${diamondTag}
    </div>
    ${listingData.hasOwnProperty("isStarlink") ? `<br><i class="fa-solid fa-satellite"></i>` : ''}<br>
    City/Country: ${listingData.city}/${listingData.country}<br>
    Download: ${listingData.downloadSpeed} Mbps${
        listingData.vpn === "yes" ? " <i>(using VPN)</i>" : ""
    }<br>
    Upload: ${listingData.uploadSpeed} Mbps${
        listingData.vpn === "yes" ? " <i>(using VPN)</i>" : ""
    }<br>
    ${pingOrJitterText}: ${speedValue} ms${
        listingData.vpn === "yes" ? " <i>(using VPN)</i>" : ""
    }<br>
    Website Used: ${
        listingData.websiteUsed === "speedtest"
            ? "Speedtest Ookla (fastest, peak speed)"
            : listingData.websiteUsed === "openspeed"
            ? "OpenSpeedTest (min. stable speed)"
            : listingData.websiteUsed === "fast"
            ? "Fast.com (fastest, peak speed)"
            : listingData.websiteUsed === "speedofme"
            ? "Speedof.me"
            : ""
    } <br>
    Dropouts: ${listingData.dropouts}<br>
    Open LAN Ports: ${listingData.openLanPorts}<br>
    <hr>`;
//    Timestamp: ${formatTimestamp(listingData.timestamp)} (put above once fixed)

    // Add the price badge to the listing element
    if ((listingData.airbnbLink || listingData.vrboLink || listingData.flatioLink || listingData.nomadicoLink || listingData.nomadstaysLink || listingData.dtravelLink) && listingData.price) {
        let priceBadge = document.createElement("span");
        priceBadge.classList.add("price-badge");
        priceBadge.innerHTML = `$${listingData.price}`;
        listingElement.appendChild(priceBadge);
    } else {
          // Display "TBD" when there is no listingData.price
          let priceBadge = document.createElement("span");
          priceBadge.classList.add("price-badge");
          if (listingData.airbnbLink || listingData.vrboLink || listingData.flatioLink || listingData.nomadicoLink || listingData.nomadstaysLink || listingData.dtravelLink) {
            // "TBD" for airbnbLink
            priceBadge.innerHTML = "TBD";
          } else {
            // "$(N/A)" for everything else
            priceBadge.innerHTML = "$(N/A)";
          }          listingElement.appendChild(priceBadge);
      }

    listingElement.appendChild(titleElement);
    listingElement.appendChild(detailsElement);
    listingContainer.appendChild(listingElement);

    // Check if additional details exist
    if (listingData.hasOwnProperty("additional")) {
      let additionalDetailsElement = document.createElement("div");
      additionalDetailsElement.classList.add("listing");

      // Iterate over the additional array
      listingData.additional.forEach(function (additionalEntry) {
        additionalDetailsElement.innerHTML += `
                    Download Speed: ${additionalEntry.downloadSpeed} Mbps${
          additionalEntry.vpn === "yes" ? " <i>(using VPN)</i>" : ""
        }<br>
                    Upload Speed: ${additionalEntry.uploadSpeed} Mbps${
          additionalEntry.vpn === "yes" ? " <i>(using VPN)</i>" : ""
        }<br>
                    Ping Speed: ${additionalEntry.pingSpeed} ms${
          additionalEntry.vpn === "yes" ? " <i>(using VPN)</i>" : ""
        }<br>
                    Website Used: ${additionalEntry.websiteUsed} <br>
                    Dropouts: ${additionalEntry.dropouts}<br>
                    Open LAN Ports: ${additionalEntry.openLanPorts}<br>
                    <hr>
                `;
      });
//                    Timestamp: ${formatTimestamp(additionalEntry.timestamp)} (put above once fixed)

      listingElement.appendChild(additionalDetailsElement);
    }
  }
