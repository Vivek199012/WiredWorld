function createListingElement(listing, listingContainer, additionalData = null) {
    if (listing.dropouts && listing.dropouts.toLowerCase() === "yes") {
        return;
    }

    // Check if the listing is submitted by host
    let hostSubmittedTag = "";
    if (listing.isHost) {
        hostSubmittedTag =
            '<span class="badge" style="background-color: #000000; color: white; padding: 5px; margin-bottom: 3px;">Host Submitted</span>';
    }

    let dropoutsTag = "";
    if (listing.dropouts == "yes") {
        dropoutsTag =
            '<span class="badge" style="background-color: #FF5F15; color: white; padding: 5px; margin-bottom: 5px; margin-bottom: 3px;"">Dropouts</span>';
    }

    let openLanPortsTag = "";
    if (listing.openLanPorts == "yes") {
        openLanPortsTag =
            '<span class="badge" style="background-color: #008000; color: white; padding: 5px; margin-bottom: 5px; margin-bottom: 3px;">Physical LAN</span>';
    }

    let verifiedTag = "";
    if (listing.verifiedLink) {
        verifiedTag = `
        <a href="${listing.verifiedLink}" target="_blank" style="text-decoration: none;">
            <span class="badge" style="background-color: #ffffff; color: #000000; border: 1px solid #000000; padding: 5px; margin-bottom: 3px; display: inline-flex; align-items: center; box-sizing: border-box;">
                Verified
                <i class="fas fa-check-circle verified-icon" style="color: #FFD700; margin-left: 5px;"></i>
            </span>
        </a>`;
    }

    let diamondTag = "";
    if (listing.diamondTag) {
        diamondTag = `
        <a href="#" data-document-id="${listing.id}" class="badge" style="background-color: #ffffff; color: #000000; border: 1px solid #000000; padding: 5px; margin-bottom: 3px; display: inline-flex; align-items: center; box-sizing: border-box; text-decoration: none;">
            Verified
            <i class="fas fa-check-circle verified-icon" style="color: #73E5FF; margin-left: 5px;"></i>
        </span>
        </a>`;
    }



    let airbnbTag = "";
    if (listing.airbnbLink) {
        airbnbTag = `
        <span class="badge" style="background-color: #FF69B4; color: white;">Airbnb</span>`;
    }

    let flatioTag = "";
    if (listing.flatioLink) {
        flatioTag = `
        <span class="badge" style="background-color: #FFD700; color: white;">Flatio</span>`;
    }

    let link =
        listing.airbnbLink ||
        listing.vrboLink ||
        listing.flatioLink ||
        listing.nomadstaysLink ||
        listing.nomadicoLink ||
        listing.dtravelLink ||
        "#";

    // Check if it's a Flatio link and add the affiliate part
    if (link === listing.flatioLink) {
        link += "?af=thewirednomad";
    }

    let ratingSection = `
    <div class="row">
        <div class="col-12">
            ${listing.isStarlink ? '<i class="fa-solid fa-satellite"></i>' : ''}
            ${listing.airbnbLink ?
                (listing.rating !== -1
                    ? `<i class="fas fa-star" style="color: #FFD700;"></i> <span style="font-size: 16px;">${listing.rating}</span>`
                    : '<span style="font-size: 16px;"> </span>')
                : ''}
        </div>
    </div>`;

    let tempHTML = `
    <div class="card" style="width: 100%;">
        ${!listing.price ? `<span class="price-badge">TBD</span>` : `<span class="price-badge">${listing.price ? `$${listing.price}` : "$(N/A)"}</span>`}
        <div class="card-body">
            <div class="row">
                <h5 class="card-title">${listing.city}/${listing.country} ${listing.home ? `"${listing.home}"` : ""} ${airbnbTag || flatioTag}</h5>
            </div>
            <div class="row">
                <h6 class="card-subtitle">${hostSubmittedTag}</h6>
                <h6 class="card-subtitle">${dropoutsTag}</h6>
                <h6 class="card-subtitle">${openLanPortsTag}</h6>
            </div>
            <div class="row verified-tag-row">
                ${verifiedTag}
                ${diamondTag}
            </div>
            <br>
            ${ratingSection} <!-- Rating section -->
            <div class="row">
                <div class="col-4">
                    <div class="icon-container">
                        <center>
                            <div class="icon-text">
                                <b><i class="fas fa-upload"></i> Upload </b>
                            </div>
                            <div class="icon-value">${listing.uploadSpeed} <br>Mbps</div>
                        </center>
                    </div>
                </div>
                <div class="col-4">
                    <div class="icon-container">
                        <center>
                            <div class="icon-text">
                                <b><i class="fas fa-download"></i> Download </b>
                            </div>
                            <div class="icon-value">${listing.downloadSpeed} <br>Mbps</div>
                        </center>
                    </div>
                </div>
                <div class="col-4">
                    <div class="icon-container">
                        <center>
                            <div class="icon-text">
                                <b><i class="fas fa-map-marker"></i> ${listing.nomadstaysLink ? "Jitter" : "Ping"}</b>
                            </div>
                            <div class="icon-value">${listing.nomadstaysLink ? listing.jitterSpeed : listing.pingSpeed} <br>ms</div>
                        </center>
                    </div>
                </div>
            </div>
            <center>
                <a href="${link}" class="viewOnSite poppins-semibold" target="_blank" rel="noopener noreferrer">
                    View on Site
                </a>
            </center>
        </div>
    </div><br>`;

    listingContainer.innerHTML += tempHTML;
}
