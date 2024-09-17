// Helper function to check if two sets of criteria are the same
function isSameSearchCriteria(criteria1, criteria2) {
   if (!criteria1 || !criteria2) {
     return false;
   }

   // Compare criteria properties
   for (let key in criteria1) {
     if (criteria1[key] !== criteria2[key]) {
       return false;
     }
   }

   // Check if all properties are the same
   return true;
}


function formatTimestamp(timestamp) {
   if (timestamp && timestamp._seconds && timestamp._nanoseconds) {
     const seconds = timestamp._seconds;
     const nanoseconds = timestamp._nanoseconds;
     const milliseconds = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
     return new Date(milliseconds).toLocaleString();
   } else {
     return "Invalid Timestamp";
   }
}


// Sorting function
function prioritizeLinks(a, b) {
   const priorities = [
       "flatioLink",
       "airbnbLink",
       "vrboLink",
       "dtravelLink",
       "nomadstaysLink",
       "nomadicoLink",
   ];
   for (let link of priorities) {
       if (a[link] && !b[link]) return -1;
       if (!a[link] && b[link]) return 1;
   }
   return 0;
}


function getLinkPrefix(data, link) {
   if (link === data.airbnbLink) {
       return "Airbnb: ";
   } else if (link === data.vrboLink) {
       return "Vrbo: ";
   } else if (data.flatioLink && link && link.split('?')[0] === data.flatioLink.split('?')[0]) {
       return "Flatio: ";
   } else if (link === data.nomadstaysLink) {
       return "NomadStays: ";
   } else if (link === data.nomadicoLink) {
       return "Nomadico: ";
   } else if (link == data.dtravelLink) {
       return "Dtravel: ";
   }
     else {
       return "";
   }
}

function meetsCriteria(data, criteria) {
   // Validate data and criteria
   if (!data || !criteria) {
     console.error("Data or criteria is undefined", data, criteria);
     return false;
   }

   // Validate data properties
   if (
     typeof data.city !== "string" ||
     typeof data.country !== "string" ||
     (data.isStarlink && (
         typeof data.downloadSpeed === "undefined" ||
         typeof data.uploadSpeed === "undefined" ||
         typeof data.pingSpeed === "undefined"
     )) ||
     (!data.isStarlink && (
         typeof data.downloadSpeed !== "number" ||
         typeof data.uploadSpeed !== "number" ||
         (data.nomadstaysLink && typeof data.jitterSpeed !== "number") || // Check for jitterSpeed when nomadstaysLink is present
         (!data.nomadstaysLink && typeof data.pingSpeed !== "number") // Check for pingSpeed when nomadstaysLink is not present
     )) ||
     typeof data.openLanPorts !== "string"
   ) {
     console.error("Data properties are not of expected types", data);
     return false;
   }

   // Destructure criteria properties
   const {
     city = "",
     country = "",
     minDownload = "",
     minUpload = "",
     maxPing = "",
     minPrice = "",
     maxPrice = "",
     openLanPorts = false,
     includeVerified = false,
   } = criteria;

   // Check each criterion
   return (
     (city === "" || data.city.toLowerCase() === city.toLowerCase()) &&
     (country === "" ||
       data.country.toLowerCase() === country.toLowerCase()) &&
     (minDownload === "" || typeof data.downloadSpeed === "string" || data.downloadSpeed >= parseFloat(minDownload)) &&
     (minUpload === "" || typeof data.uploadSpeed === "string" || data.uploadSpeed >= parseFloat(minUpload)) &&
     (maxPing === "" || typeof data.pingSpeed === "string" || data.pingSpeed <= parseFloat(maxPing)) &&
     (criteria.platforms.flatio || data.platform !== "flatio") && // Exclude Flatio listings if "flatioChecked" is false
     (!openLanPorts || data.openLanPorts === "yes") &&
     (maxPrice === "" || !data.price || data.price <= parseFloat(maxPrice))&&
     (minPrice === "" || !data.price || data.price >= parseFloat(minPrice))&&
     (!includeVerified || (data.verifiedLink || data.diamondTag))

   );
}

//used for the search bars
function autoComplete(inp, arr, page = "view" ) {
 /*the autocomplete function takes two arguments,
 the text field element and an array of possible autocompleted values:*/
 var currentFocus;
 /*execute a function when someone writes in the text field:*/
 inp.addEventListener("input", function(e) {

     var a, b, i, val = this.value;

     /*close any already open lists of autocompleted values*/
     closeAllLists();
     if (!val) { return false;}
     currentFocus = -1;
     /*create a DIV element that will contain the items (values):*/
     a = document.createElement("DIV");
     a.setAttribute("id", this.id + "autocomplete-list");
     a.setAttribute("class", "autocomplete-items");
     a.style.position = "absolute"; // Set position to absolute
     a.style.zIndex = "999"; // Set a high z-index to ensure it floats above other elements
     a.style.borderRadius = "6px";
     a.style.width = "96%";
     a.style.backgroundColor = "#ffffff";
     a.style.marginTop = "55px";
     a.style.textAlign = "center";

     //additional styling for the search bar on the home page, not sure why this is necessary, probably conflicting css
     if (page === "home") {
       a.style.marginTop = "65px";
       a.style.width = "90%";
       a.style.marginLeft = "40px";
     }

     /*append the DIV element as a child of the autocomplete container:*/
     this.parentNode.appendChild(a);

     /*loop through the items (countries/cities) to see if the input text matches the first letters of the item:*/
     let maxSuggestions = 8;
     let numSuggestions = 0;
     for (i = 0; i < arr.length ; i++) {
       /*check if the item starts with the same letters as the text field value:*/
       if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
         // Limit the number of suggestions
         if (numSuggestions < maxSuggestions) {
             /*create a DIV element for each matching element:*/
             b = document.createElement("DIV");
             b.style.paddingTop = "4px";
             b.style.paddingLeft = "4px";
             b.style.paddingBottom = "3px";
             b.addEventListener("mouseover", function(e) {
               /*change the background color to light gray when hovered over:*/
               this.style.backgroundColor = "#f1f1f1";
             });
             b.addEventListener("mouseout", function(e) {
               /*change the background color back to white when not hovered over:*/
               this.style.backgroundColor = "#ffffff";
             });

             /*make the matching letters bold:*/
             b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
             b.innerHTML += arr[i].substr(val.length);
             /*insert a input field that will hold the current array item's value:*/
             b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
             /*execute a function when someone clicks on the item value (DIV element):*/
             b.addEventListener("click", function(e) {
               /*insert the value for the autocomplete text field:*/
               inp.value = this.getElementsByTagName("input")[0].value;
               /*close the list of autocompleted values,
               (or any other open lists of autocompleted values:*/
               closeAllLists();
             });
             a.appendChild(b);

             numSuggestions++;

         }//end of if numSuggestions <= maxSuggestions
       } //end of if arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()
     }//end of for loop
     if (numSuggestions === 0) {
       //why does the text not wrap?
       b = document.createElement("DIV");
       b.innerHTML = "Unfortunately, we don’t have any <br> listings at this location yet. <br><br> <strong>For Landlords:</strong> Once you <br> <a href='https://thewirednomad.com/submit'> submit your internet speeds, </a> <br> we'll add your listing to the platform!";
       b.classList.add("no-results");
       b.style.marginTop = "20px";
       b.style.marginBottom = "20px";
       a.appendChild(b);
     }
 }); //end of inp.addEventListener

 function closeAllLists(elmnt) {
   /*close all autocomplete lists in the document,
   except the one passed as an argument:*/
   var x = document.getElementsByClassName("autocomplete-items");
   for (var i = 0; i < x.length; i++) {
     if (elmnt != x[i] && elmnt != inp) {
       x[i].parentNode.removeChild(x[i]);
     }
   }
 }
 /*if the user clicks away, get rid of the dropdown*/
 document.addEventListener("click", function (e) {
     closeAllLists(e.target);
 });

} //end of autoComplete function


 //used to get the query parameters from the URL (necessary when doing a search from the home page)
 function getQueryParams() {
     const query = window.location.search.substring(1);
     const params = {};
     const vars = query.split('&');
     for (let i = 0; i < vars.length; i++) {
         const pair = vars[i].split('=');
         try {
             params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
         } catch (e) {
             console.error('Error decoding URI component:', pair[0], pair[1]);
         }
     }
     return params;
 }



//To synchronize the inputs from the dropdowns with the inputs in the search bars
 function synchronizeCheckbox(checkbox1, checkbox2) {

    checkbox1.addEventListener('change', function() {
        checkbox2.checked = checkbox1.checked;
    });

    checkbox2.addEventListener('change', function() {
        checkbox1.checked = checkbox2.checked;
    });
}

function synchronizeInput(input1, input2) {

    input1.addEventListener('input', function() {
        input2.value = input1.value;
    });

    input2.addEventListener('input', function() {
        input1.value = input2.value;
    });
}

// Synchronize checkboxes
var checkboxes = [
  { header: document.getElementById('airbnb'), dropdown: document.getElementById('airbnbInDropdown') },
  { header: document.getElementById('vrbo'), dropdown: document.getElementById('vrboInDropdown') },
  { header: document.getElementById('nomadstays'), dropdown: document.getElementById('nomadstaysInDropdown') },
  { header: document.getElementById('nomadico'), dropdown: document.getElementById('nomadicoInDropdown') },
  { header: document.getElementById('dtravel'), dropdown: document.getElementById('dtravelInDropdown') },
  { header: document.getElementById('flatio'), dropdown: document.getElementById('flatioInDropdown') },
  { header: document.getElementById('verified'), dropdown: document.getElementById('verifiedInDropdown') }
];

checkboxes.forEach(function(checkbox) {
  synchronizeCheckbox(checkbox.header, checkbox.dropdown);
});


// Synchronize Mbps inputs
var minUploadInput = document.getElementById('min-upload');
var minDownloadInput = document.getElementById('min-download');
var minUploadDropdownInput = document.getElementById('min-uploadInDropdown');
var minDownloadDropdownInput = document.getElementById('min-downloadInDropdown');

synchronizeInput(minUploadInput, minUploadDropdownInput);
synchronizeInput(minDownloadInput, minDownloadDropdownInput);


//used to initialize the search bar immediately to get around firebae handshake issue
function getAllItems() {
  return [ "Santo Isidoro", "Gros Cailloux", "Gaborone", "Rolleville", "Port St. Lucie", "Cangrejera", "Vodice", "Papaikou", "Lajes do Pico",
  "Sant Cugat del Valles", "Valadares", "Liverpool", "Alacant", "Surigao del Norte", "Puerto Ayora", "Valldemossa", "Le Lavandou",
  "Mapua", "Vega Baja", "Panguipulli", "Sopó", "Hallston", "Port Barton", "tent Mulegé", "Colotepec", "La Colmena", "Rainow",
  "Fernhill", "Montego Bay", "Gardefort", "Varna", "Sedona", "Governor's Harbour", "Trinidad", "Palomino", "Pan de Azúcar",
  "Razlog", "Turin", "Arthurs Point", "Catagnan", "Amadora", "Mosta", "El Pescadero", "Sathon", "Hinton", "Vlachata", "Monte Carmelo",
  "Boliqueime", "Dallas", "Mulegé", "Killin", "Barksdale", "Mao", "Carmel Valley", "Highlands East", "Ostrava", "Карпош",
  "Cabo Corrientes", "Montréal", "Chongqing", "Downsville", "Sekiu", "Asa Norte", "Grand County", "Groveland", "Black Mountain",
  "Yandina Creek", "San Luis Potosí", "Cambrils", "Tāwharanui Peninsula", "Puelo", "Azeitao", "San Carlos de Bariloche", "Chivor",
  "Paros", "Lenox", "Santanyí", "Columbia-Shuswap", "Havelock", "Omanawa", "São Gonçalo do Sapucaí", "Hurghada", "Pukenui", "L'Ametlla de Mar", "Cacique", "Rumizapa",
  "Jaibalito", "Silvania", "Gardiner", "Nagymaros", "Magog", "Palm Springs", "Bobundara", "Ocho Rios", "Rotorua", "Township Of South Frontenac", "Seregno", "Bioglio", "Pelluhue", "Thompson-Nicola",
  "Chicxulub Puerto", "Luxembourg", "Nelson", "Burgos", "Sawyers Gully", "La Savina", "bed and breakfast Dinagat", "Columbia Falls", "Santa Ynez", "Kernville", "Alfonso", "Fréjus", "Carlton", "Kapetanija",
  "Mariato District", "Spring Beach", "Phuket", "Negril", "Maynardville", "Dubrovnik", "Afton", "AlgonquHighlands", "Denia", "Aveiro", "Fajardo", "Randle", "Vale de Cambra", "Sliema", "Vila Franca de Xira", "Béganne", "Chiang Mai",
   "Attappatti", "Port Royal", "Laxe", "treehouse in Bocas del Toro", "Catarman", "San Francisco ", "Mosfellsdalur", "Chertsey", "Rincon", "Angra do Heroismo", "Duhamel", "Litava", "Verona", "Salamanca", "Santa Fe", "Santa Cruz de Tenerife", "Plaquemine", "Olmué", "San Jose", "Wisemans Ferry", "Coupeville", "Sofia", "Pescadero", "Okanogan County", "Stockholm", "Culebra", "Albese con Cassano", "Serra Negra", "Smolianskite ezera", "Málaga", "Mogán", "Lefkada", "Tafira Alta", "El Hawaii", "Mandaluyong", "Samaná", "Covilhã", "Bayfield Inlet", "Prescott", "Nigran", "Medellín", "Pichilemu", "Guasacate", "Visconde de Maúa", "El Monte o Guargacho", "Wawona", "Buchupureo", "The Hague", "Lanexa", "Southside", "Thiviers", "Lake Almanor Country Club", "Twentynine Palms", "Buenavista",
  "San Marcos La Laguna", "Corfu", "Vilnius", "bed and breakfast Iúna", "Sonora", "Pefkochori", "Windham", "València", "Xiropigado", "Thale",
  "Alvor", "Stratton", "Sitges", "Niterói", "Saint-Cyr-sur-Mer", "Milan", "Appleton", "Timor", "Ankara", "Jefferson", "Krk", "Rochester",
  "Rio de Janeiro", "Litsarda", "Antipolo", "Da Nang", "Boquete", "Los Sauces", "Tamba", "Capdrot", "San Juanico", "Bures-sur-Yvette",
  "Yellowhead County", "Grosuplje", "Rotterdam", "Entiat", "Tibau do Sul", "Cali", "Pauwela", "in Mazamitla", "Connellan", "Itatiaiuçu",
  "La Barra", "Kato Fellos", "Ventiseri", "Rainier", "Ponta Delgada", "Morro Amarillo", "Chimo", "Joanópolis", "Chehalis", "Winter Park",
  "Uspallata", "Bilbao", "Fallbrook", "Kosice", "Birregurra", "Sapi-an", "Lodz", "Panormos", "Caleta de Fuste", "Auckland", "Québec", "Esposende",
   "Matosinhos", "Rotoma", "Ōakura", "Port Ludlow", "Pomborneit East", "Campbell River", "Ocean View Market", "Thessaloniki", "Chania", "La Minerve",
   "Kas", "Santa Monica", "Rionegro", "Cumberland", "Loule", "Torrenueva Costa", "Firgas", "Navidad", "Borrego Springs", "Bratislava",
   "Split", "Carvoeiro", "Winthrop", "Vila Nova de Cacela", "Cozumel", "Ribeira Brava", "Malibu", "Murter", "White House", "Zonza",
   "San Sebastián del Oeste", "Consolacion", "San Vicente", "in Pucon", "Bassett", "Taos Ski Valley", "Lourinha", "Si Thep", "Leiria",
   "Olhao", "Ambatoloaka", "Pedasi", "Pensacola", "Gold River", "Πευκοχώρι", "Albert Town", "Riverside", "San Pedro La Laguna",
   "Puntas", "Quelfes", "Oia", "Cristóbal Island", "Whangapoua", "Liddes", "Cabanga", "Camp Verde", "Domingos Martins",
   "Duncans Mills", " Yosemite National Park ", "Vicchio", "Haliburton", "Macanal", "Wiarton", "Cantanhede", "Karlovy Vary", "Muravera",
   "Ely", "Barrengarry", "George Town", "Sa Ràpita", "Playa Junquillal", "Cadiz", "Avis", "Bend", "Anand Nagar", "Lincoln City",
   "Purlear", "Rincón", "La Ronge", "Arcos de Valdevez", "Montes de Oca", "Santiago", "Playa San Agustinillo", "Sisal", "Urubamba",
   "Mendon", "Placencia", "Rome", "San Miguel de Allende", "Patumahoe", "Atlin", "Caminha", "Santa Ponsa", "Martinborough",
   "Vichayito", "Taghazout", "Artemonas", "Kihei", "Gy-en-Sologne", "Rio Preto", "Sheguiandah", "Tillamook", "Treviso", "Taganana",
   "Ogled", "Shela", "Ixelles", "Cuautlita Huauchinango ", "Algarrobo", "Skjoldehamn", "Saint Andrews Beach", "Stanley", "Camalú ",
   "Edinburgh", "Newland", "Calauan", "Osaka", "Gregory Town", "Palawan", "Sanur", "Lucea", "Lisbon", "Barreiro", "Callao Salvaje",
   "Iztapa", "Gualala", "Silang", "Hoopers Bay", "Primošten", "Pittsburgh", "Panglao", "Herepeia", "Lazi", "Plourin-lès-Morlaix",
   "Esmoriz", "Barcelona", "Belitsa", "Salou", "hotel in San Marcos La Laguna", "Kyoto", "Omišalj", "Bénodet", "La Libertad",
   "Balaia Golf Village", "Las Terrenas", "Berlin", "in Sequim", "San Martino Al Cimino", "Portland", "Tequila", "Silver Sands Beach",
   "Alges", "Rawlins", "Snohomish", "Coarsegold", "Evansville", "Lavra", "Tenino", "Glacier", "Sesimbra", "Burgas", "Alcoi",
   "Westerose", "Port Loring", "Khet Khlong Toei", "Palmela", "Bang Na", "Paco de Arcos", "Geni", "Palairos", "Guarda", "Odivelas",
   "Kaikōura", "Maspalomas", "San Rafael", "in Navidad", "Lourdata", "Pioneertown", "Bethel", "Illes Balears", "Alcacer do Sal",
   "Kawakawa", "Canidelo", "Venice", "Hanoi", "Mariposa", "Alijo", "Chappell Hill", "Las Palmas de Gran Canaria", "Ferrara",
   "Ponte de Lima", "Moss Vale", "Penuwch", "Waitomo", "Maitencillo", "Estoril", "Buderim", "Algonquin Highlands",
   "Playa De Las Tortugas", "Bastimentos Island", "Bicheno", "hotel Bacalar", "Nairobi", "Rhodes", "Punta Sal", "El Campello",
   "Santa Maria da Feira", "El Nido palawan", "Cabrera", "Santa María Colotepec", "Redfern", "Kawartha Lakes",
   "Puerto Baquerizo Moreno", "Montagudet", "Easton", "Mijas", "Malaga", "Oakland Park", "Robe", "Toronto", "Privlaka",
   "Greater London", "TarwLower", "Marinha Grande", "Boadilla del Monte", "Pollenca", "Boston", "Tasman", "Carmen de Apicalá",
   "Lekki", "nature lodge Hapuku", "Flores", "Caldes de Malavella", "in Linares", "Lefkes", "Drumheller", "Pointe-Noire", "Jenner",
   "Avignon", "Plouescat", "Paris", "Puerto Angel", "Almeida", "Yallingup Siding", "Keeseville", "Tabor", "Ojai", "Austin",
   "Zaragoza", "Puerto Malabrigo", "Las Lajas", "Hanioti Beach", "Futaleufú", "Pittsburg", "Bankso", "Milano", "Kinmount",
   "Nambsheim", "Gillingham", "Lujan de Cuyo", "Buritaca", "South Bloomingville", "Cádiz", "Garita", "Berkeley Springs",
   "rental unit General Luna", "Saint-Aquilin", "Moorina", "Vila do Conde", "donore", "Woodland", "Belas", "Robbinsville",
   "Providence", "Orocovis", "Arcadia", "Te Rāpaki-o-Te Rakiwhakaputa", "Valparaíso", "Whitestone", "Waipahu", "Golden",
   "Isabela", "Upper Burringbar", "Stazzo", "Inverness", "Funchal", "San Genesio Atesino", "Bialystok", "Playa del Carmen",
   "Albufeira", "home in Santa Cruz la Laguna", "Portsmouth", "Velindre", "Warsaw", "Saint-Avit-Sénieur", "Palma",
   "São Francisco Xavier", "Marblemount", "Chaumont", "Muri", "Hochstetter", "in Bryson City", "Vothonas", "Centro",
   "Urbanizacion la Suerte", "Port Angeles", "Almogía", "Kalecik", "Guna Yala", "Ierapetra", "Port St. Joe", "Premia de Mar",
   "Cuenca", "Amsterdam", "St Davids", "Bellaire", "Castro", "Kailua", "Unorganized Centre Parry Sound District", "Istanbul",
   "Gleniffer", "Arachova", "Figueira da Foz", "Madrid", "Praia do Guajirù - Ilha do Guajirù - Kite Lagoon", "St. Louis",
   "Leesburg", "Waimauku", "Walkerville North", "Neebing", "São José dos Campos", "Roudnice nad Labem", "Ewingsdale", "Calgary",
   "Kalami", "Rocca di Papa", "Bancroft", "Garita Palmera", "Tequesquitengo", "Miami", "Clarin", "Pogonia",
   "nature lodge Three Rivers", "Linares", "Cavaillon", "Sojuela", "Julian", "Garden Island Creek", "Keaau", "Yakima", "Rethymno",
   "Sestajovice", "Kefallonia", "Maysville", "Front Royal", "Colón Island", "Strong", "Florence", "Craigsville", "Crete",
   "El Tablazo", "Vilassar de Mar", "Poulsbo", "Florissant", "Ojo de Agua", "Les Clayes-sous-Bois", "Vico del Gargano", "Troia",
   "Harbor Springs", "Hamilton", "Canyamel", "El Nido", "in Naches", "Cambridge", "Crystal Beach", "Panquehue", "Panamá Oeste",
   "Bocas del Toro Province", "Lagarde-Hachan", "La Plagne-Tarentaise", "Alexandria", "Καλαμάτα", "Goshen", "El Albir", "Sequim",
   "Sprucedale", "Oakpark", "Monument", "Goochland", "Adventure Bay", "Carenero Island", "Alcobaca", "Catania", "Alpino",
   "Playa La Saladita", "Recife", "Half Moon Bay", "Talkeetna", "Marshburg", "Ilha Grande, Río de Janeiro", "Cold Springs",
   "Coron", "Agkonas", "Acajutla", "Kirk Michael", "Haiku-Pauwela", "Stylida", "boutique hotel in San Juan La Laguna",
   "Mambajao", "Praia Tofo", "Portalegre", "Provetá", "Torremolinos", "Rodney Bay", "Lumambong Beach", "Fairbanks", "Catanzaro",
   "Nosara", "Sao Roque do Pico", "Angra dos Reis", "Clarence Point", "Kecamatan", "Los Abrigos", "Darby", "Colares", "Oak Run", "Northampton", "Lo Barnechea", "Laguna de Chacahua", "Seville", "Bocaina de Minas", "Les Angles", "Alanya", "Sinj",
   "Progreso", "Dénia", "La Côte-d'Arbroz", "Addy", "Ericeira", "Cooke City-Silver Gate", "Ribeira", "Przemysl", "El Chaltén", "Puerto Ángel", "Chamonix-Mont-Blanc", "Silves", "Condon", "Trogir", "Roda de Bera", "Millthorpe",
   "Jamaica", "Diani Beach", "Johannesburg", "Canelas", "Kawhia", "Swakopmund", "London", "Whittier", "North Palmetto Point", "Cantón Potrero Grande", "Three Rivers", "Montgomery", "Hanga Roa", "Aibonito", "Palmerton", "A Guarda", "La Center", "Sadska", "Clayton", "Bethesda", "Emigrant", "Pombal", "Acharavi", "Portisco", "Bantanges", "Big Sky", "Halls Gap", "West End",
   "Saint Erth", "Santo Domingo Ocotitlán", "San Agustinillo", "Santa María Tonameca", "Tepoztlan", "大同村", "Lázaro Cárdenas", "in Lenoir", "Terrebonne, OR", "Londrina", "San Pedro", "Ho Chi Minh City", "Nevada City", "City of Balanga", "Yapeen", "Gdansk", "Nea Smyrni", "Tortona", "Napoli", "Tulalip Bay",
   "Leca da Palmeira", "Ponta do Sol", "General Luna", "Bacolor", "Bentonville", "Sandy Point", "Akteo", "Snowmass", "La Molina",
   "Point Roberts", "Wroclaw", "boutique hotel in Pupuya", "Burjassot", "Carlux", "Bansko", "Tutukaka", "Moab", "Estreito da Calheta", "Armacao de Pera", "Xico", "Pupukea", "Aptera", "Whitethorn", "Lock Haven", "Markleeville", "Malinska", "Beograd", "Mahahual",
   "Malalcahuello", "Lodares de Osma", "Metz", "Blanco", "Bayerisch Gmain", "Nilo", "Río Lagartos", "Kimberley", "Loreto", "Burk's Falls", "Caguas", "Mexico City", "Sierra Cabrera", "Highlands", "Sant Llorenc des Cardassar",
   "Beaumont-les-Autels", "Copacabana", "Sipalay", "Rio Dulce", "guesthouse in Santa Cruz la Laguna", "Máncora", "Hot Water Beach", "Gualaquiza", "Donnelly", "Vila Praia de Ancora",
   "Wongarra", "Maslinica", " Dysart et al", "Port Albert", "Āwhitu", "Freiburg im Breisgau", "Cirí Arriba", "Faro", "Eganville", "Pottsville", "Coruche", "Olaya", "Vilar de Mouros", "Puchuncaví", "Waldhof", "Flamenco", "Pateros", "Pamplin", "Vejer de la Frontera", "L'Espluga de Francolí", "Cornwallville", "Sant Carles de Peralta", "Alberton", "Alexandra", "Queluz", "Valencia", "Cowes", "South Aegean", "Los Cristianos",
   "Clayhidon", "Aguacate", "Ury", "Lido di Camaiore",
   "Guatapé", "Matagorda", "Yabucoa", "Athina", "Te Anau", "Fair Haven", "Merrijig", "Dimiao", "Cáhuil", "Hueitra", "Almada", "Le Barroux", "Villa de Leyva", "Golden Lake", "San Andres", "San Felípe", "Lake Linden", "Lion's Head", "Ste-Béatrix", "Raurimu", "Cascais", "Pupuya", "in Malalcahuello", "Chiclana de la Frontera", "Lanjaron", "Todos Santos", "Buarcos", "Bohol", "Skala", "Joshua Tree", "Girona", "Arona", "Alcochete", "Menteng",
   "Cavle", "Banner Elk", "Guachaca",
   "Georgian Bay", "Saanen", "Mazunte ", "Accomac", "Renfrew", "Obidos", "Novi Sad", "Felanitx", "La Oliva", "Bouisse", "Pula", "Lethbridge", "Rainbow Beach", "Namur", "Marión", "Blowing Rock", "Pano Lefkara", "Torio", "San Sebastian", "Melgar", "Great Cacapon", "Tofo Beach", "Quillota", "Anderson", "hotel in Hanga Roa", "Tambon Patong", "Yallingup", "Onaero", "Lyle", "Atouguia da Baleia", "Saint-Jean-d'Aulps", "Island Garden City of Samal", "Dapa", "Sao Felix da Marinha",
   "East Meadow", "Zapallar", "Tiltil", "in Little Deer Lake", "La Mision", "Waitsburg", "Céret", "Retiro", "Humacao", "in Broken Bow", "Puertito de Guimar", "Philadelphia", "Ashford", "Candelaria", "Sibiu", "Champaign", "Santa Ysabel", "Topton", "Prattsville", "Stirling", "Montevideo", "Canical", "Carlsbad", "Cartagena de Indias", "Vila Real de Santo Antonio", "San Francisco", "Maroochydore", "Horta", "Enumclaw", "Powassan", "Champney's West", "Beyoğlu", "Karşıyaka", "Contadora Island", "Portloe", "Christchurch", "Bakonyszentlászló", "Greenville", "Fraser-Fort George G", "Nova Friburgo",
   "Marion", "Barry's Bay", "Lawson", "Tarragona", "Chon Buri", "Murray River", "Palmer Rapids", "Kuta", "Colville", "Santo Domingo", "Lagos", "boutique hotel Alfonso", "Vila Nova de Gaia", "Cancún", "Quito", "Baras", "Wakefield", "Butuan", "Mikonos", "Ouzouer-sur-Loire", "Altura", "Oakhurst", "Makati", "Domme", "Strasbourg", "Plettenberg Bay", "Medellin", "Yosemite National Park", "Kastellani Achillion", "Lac du Bonnet", "Yásica Arriba", "Quarteira", "Combermere", "San Marcos la laguna", "Ocean Park", "Tirana", "Central Macdonald", "Bocas del Toro ", "Belgrade", "Spokane", "Gradil", "Euless", "San Crisanto", "Somerset", "Bolivar Peninsula", "Tabio", "Freeville", "Baltimore", "Shaver Lake", "Gouvia", "San Cristobal de La Laguna", "Noord", "Zadar", "Viana do Castelo", "Puimoisson",
    "Salernes", "Sawmill Settlement", "Minca", "Caselline", "Kato Gouves", "Creswell", "Cochiguaz", "La Ciotat", "Cooperativa Barraciega", "Jaffray", "Oroville", "Cordoba", "Amarilla Golf", "Vallromanes", "Zlatibor", "El Cuyo", "Pertuis", "Pine", "Accra", "Havelock North", "Kristiansund",
   "San Martín de los Andes", "Rat Burana", "Kaiteriteri", "Papamoa", "Guadalajara", "yurt Downsville", "Maraú", "Pessada", "Taipei", "Deborah Bay", "Quinta do Anjo", "Deadman's Cay Settlement", "Barra de la Cruz", "Giulianova", "Minden", "Leander", "Whitehall", "Chiloquin", "Marble", "Atenas Canton", "Warkworth", "Voluntari", "Helsinki", "Itapeva", "Bogota", "Grand Baie", "Falls Creek", "Driggs", "Mahahual ", "East Jindabyne", "Armstrong", "Marina di Ravenna", "Rankoshi", "Mykonos", "Fairlee", "Calango", "Creola", "Leticia", "Ubud", "Aguimes", "Sao Jacinto", "Sainte-Émélie-de-l'Énergie", "Brasília", "Rosa Glen", "Högbenvägen", "Setubal", "Seattle", "Jarabacoa", "Gavalochori",
   "Krungthep Wing", "Keremeos", "Waitetuna", "Lake Lure", "Mechi", "Halcombe", "Fuengirola", "Waipapa", "Garfield", "Evia", "Campo", "Plovdiv", "Cabo Pulmo", "Itirapina", "Bracara", "Grad Zadar", "Winlaw ", "Springville", "Los Amates", "Savannah Sound", "Islas Baleares", "Camas", "Lakefield", "Port Colborne", "Raposeira", "Schmitten", "San Pedro de Atacama",
   "Ginetes", "Nazare", "Carcavelos", "Machico", "El Pinell de Brai", "Emiliano Zapata", "in Matanzas", "Celestún", "Villeurbanne", "Wellington", "Dolores Hidalgo ", "Isla Mujeres", "Linda-a-Velha", "Sosúa", "in Mazama", "Aljezur", "Boulder",
   "Uchaux", "Old Fort", "Gijón", "Capitólio", "Outeiro da Cabeca", "Blackrock", "Zona Rurual", "El Higo", "Vienna", "Aspe", "Russell", "Veszprem", "Upper Crystal Creek", "Suesca", "Blind River", "Vars", "Wawa", "Sevierville", "Arteaga", "La Esperanza", "Seia", "La Mata", "Coimbra", "La Conception", "Ohrid", "San Juan La Laguna",
   "Sanlucar de Barrameda", "Santa Cruz la Laguna", "Port Louis", "El Grullo", "St Thomas", "Klamath", "San Paolo", "Torres Vedras", "Sao Mamede de Infesta", "Alconàsser", "Los Llanos de Temalhuacán", "Val-des-Monts", "Grans", "Harman", "Heber Springs", "Oslo", "Edmonton", "Murcia", "hotel Guachaca", "Troy", "Trout Lake", "Caparica", "Langrune-sur-Mer", "Le Mans", "Hot Springs", "Adeje", "North Frontenac", "Folkestad", "Watthana", "Plemmirio", "Gold Bar", "Dibulla", "Puerto Carrillo",
   "Warwick", "Hammersmark", "Morzine", "Mafra", "Talbingo", "Marathon", "Natal", "Sibenik", "Plintri", "Xaló", "Calle D", "Tulum", "Glenwood", "Saint-Sernin", "Rancho Palos Verdes",
   "Cabo Rojo", "Kenora", "Lyon", "Seaview", "Sabaneta", "Santiago de Tolú", "Moskenes", "Mechanic Settlement",
   "Logan Lake", "Durrës", "Sintra", "Itagimirim", "in San Pedro la Laguna", "Kupres", "Calistoga", "Cabo San Lucas", "in Siler City", "Comares", "Hillsboro", "Tarifa", "Sebright", "Plomeur", "Watamu", "Pefkochori Beach", "Bologna", "Chacahua", "La Caleta", "Trou d'Eau Douce", "Label House Group", "Tavira", "Santo Antônio do Pinhal", "Gavalohori", "Hải Bối", "Avaré", "Quéntar", "Killeagh", "Palo Cedro", "Guia", "Clarksville", "Villarrica", "in Pucón",
   "boutique hotel in Jaibalito", "Las Galeras", "Puerto del Rosario", "Bozeman", "Mazatlan", "Odemira", "Cruzília", "San Salvador", "Copacabana, Río de Janeiro", "Santiago do Cacém", "Timisoara", "Forks", "Arraiolos", "Pérula", "Durres", "Portimao", "Na h-Eileanan an Iar", "Agaete", "York", "Georgioupoli", "Abel Tasman National Park", "Ko Pha-Ngan", "Iquitos", "Port Howe", "Norfolk", "Carmen", "Asti", "Loures", "West Melton", "Kaeo", "Ligar Bay", "Lawrenceville", "Arosa", "Perea", "Merida", "Biot", "Villanova", "Teror", "Walpole", "Mackenzie", "Halifax", "Moledo", "Guillena", "Solin", "Agta", "San Pedro Pochutla", "California Hot Springs", "Nassau", "Wemyss Settlement", "Thesaloniki Promenade", "Saint-Briac-sur-Mer", "Magboro-Akeran", "Saint-Adolphe d'Howard", "Cairo", "Mangamahu", "La Merced", "Zipolite", "Gilmour", "Playa Grande", "Alcabideche", "apartLeticia", "Senhora da Hora", "Badalucco", "Kerkira", "Santos, Sao Paulo", "Santa Paula", "Viña del Mar", "San Blas Islands", "Yucca Valley", "Healesville", "Ferrel", "Puerto Natales", "Kathu", "Harbor Island", "Westport ", "Hunters", "Vantage", "Saint-Martin-de-Beauville", "Cle Elum", "Lajes das Flores", "Valbom", "in Curacautín",
    "Valverde", "Tanay", "Huntsville", "Gran Alacant", "Colby", "Amuri", "in Mill Spring", "Llampaies", "Ricaurte", "Cleveland", "Ponunduva", "Santa Teresa Beach", "Finca Cacique", "Vero Beach", "Río Ibáñez", "Seoul", "Gonçalves", "Attica", "Deltebre", "Spanish Wells", "Göreme", "Petrópolis", "Melipeuco", "Puerto Vallarta", "Tygh Valley", "Okrug",
   "Alenquer", "Aguada", "Cesky Brod", "Kingston", "El Cruce", "Cape Broyle", "College Station", "Sao Vicente", "Melides", "Huaral", "Peniche", "Klamath Falls", "Malmö", "Beechmont", "Moira", "Guánico Abajo", "Luz", "Bentonville ", "Meos Mansar", "Calheta de Nesquim", "Eldorado", "Pisek", "Watsonville", "Techac Puerto", "Catangnan", "Rodney", "Glendale", "Fraser Island", "Barranquilla", "Creemore", "Arauco", "Nemi", "Castellabate", "Boca del Drago", "Montpellier", "Spruce Pine", "Oeiras", "Santa Teresa", "Comporta", "in Nandayure", "Carmel-by-the-Sea", "Brno", "Ramona", "L'Hospitalet de Llobregat", "Crested Butte", "Gravenhurst", "Marpequena", "Buffalo Narrows ", "Leona Valley", "Juquehy", "Ardbrecknish", "Grandola",
   "Røros Municipality", "Geafond", "Lagartero", "Soido", "Maggie Valley", "Kerikeri", "Sarajevo", "Les Laurentides Regional County Municipality", "Township of Taylorsville", "Puerto Villamil", "Tamara", "Ko Samui", "Utuado", "Marinici", "Bajamar", "Plzen", "Agassiz", "Corralejos", "Tucson", "Ilawa", "Brainerd", "Punta de Zicatela", "Caldas da Rainha", "Derby", "Brasstown", "Riva", "Pentati", "Dinner Plain", "Palermo", "La Mesa", "Joshua Tree National Park", "Saintes-Maries-de-la-Mer", "Granada", "Monterrico", "Logan", "Bueno Brandão", "Armação de Pêra", "Black Hawk", "Pinhão",
   "Sipora Selatan", "Kampia", "Woodhouselee", "Warszawa Śródmieście", "Proenca-a-Nova", "Barra de Navidad", "Venus Bay", "Maillebois", "Nicosia", "Iseo", "Virgin", "Pichilingue", "Dwight", "Raglan", "Sayulita", "Matanzas", "Otis", "Extrema", "Serifos", "Antalya", "Dornoch",
   "Itamonte", "Jakarta", "Bocas del Toro", "Sopetrán", "Quezon City", "Miraflores", "Orleans Parish", "Khon Buri", "High Level", "Arucas", "Mancelona", "Pachacamac", "Silveira", "Lima", "Louisa", "Canico", "Witta", "Vargem", "Panama", "in El Colorado", "Badian", "Los Romanes", "Coulterville", "Cansaulim", "Big Horn County", "Monroe", "Ribamar", "Ljubljana", "Martina Franca", "Lo de Marcos", "Milton", "Talamanca", "Filandia", "Matapouri", "Corralejo", "Taupō", "Combloux", "Stjärnsund",
   "Santa Eulalia", "Brisas de Zicatela", "Puerto escondido", "Bangkok", "Innisfil", "Westfield", "Akumal", "Battle Ground", "Guanica", "Sarande", "in Franklin", "Costa da Caparica", "Lanham", "White Salmon", "Brasov", "Currie", "Corsavy", "Eungella", "Prince Edward", "Isla de Pascua", "Girardot", "San Juan", "Bacalar", "Marina", "Victoria", "Naches", "Troncones", "in Hayesville", "Highland Grove", "Leavenworth", "Gimli", "Sámara", "Manteigas", "Manacapuru", "Et Al", "Zakinthos", "Maynas", "Colombo", "Calaca", "San Bruno", "Taito City", "Social Circle", "Grand Marais", "Almeria", "El Sauzal", "Vancouver", "Ronda", "Egmond aan Zee", "Hartville", "Úrsulo Galván", "Bogotá", "Seixal", "Paraty", "Egernsund", "Tenerife", "Dripping Springs", "Waihopai Valley", "Becici", "Heber-Overgaard", "München", "Puerto San José", "Badalona", "La Serra d'Almos", "Leeds and the Thousand Islands", "Javorina", "Villa Berna", "Courbevoie", "Dubai", "Landers", "Tarpum Bay", "Heraklion", "Harcourt", "Sopot", "Walkerville", "Oxapampa", "Povoa de Varzim", "Popoyo", "Pangburn", "Baiao", "Pléneuf-Val-André", "hotel Todos Santos", "Medical Lake", "Les Laurentides", "Kuala Lumpur", "Cape Town", "Fonyod", "Booroobin", "Bellingham", "Big Pine Key", "El Medano", "Puerto Varas", "Bonneville-sur-Touques", "Oak Park", "Castello de la Plana", "Chesterville", "La Orotava", "Playa Venao", "New York", "Portoroz", "Santiago do Cacem", "Mosfellsbaer", "Vendays-Montalivet", "Porto", "La Fortuna", "Zagreb", "Juquitiba", "in Ensenada", "Echo Bay", "Vigo", "Itatiaia", "Ferndale", "Druyes-les-Belles-Fontaines", "Ebony", "Sao Bartolomeu de Messines", "Powerview", "Broadwoodwidger", "Cartagena", "Tachero", "Los Realejos", "Ferreira do Zezere", "Idaho Springs", "Friday Harbor", "Oaxaca De Juárez", "Upper Hutt", "Ballybunion", "Ocala", "Pera", "Pynn's Brook", "Mazunte", "Salmon Cove", "Fairplay", "Buenos Aires", "Vavkeri", "Puerto de la Cruz", "Santa Cruz", "Fredonia",
    "Gouveia", "San Andrés Calpan", "Hersonissos Beach", "Broadway", "Calheta", "Gulf Shores", "Chundale", "Fort Lauderdale", "Cologne", "Ferragudo", "Otago", "San Piero a Sieve", "Rock", "La Conner", "Pardubice", "Desamparados", "Cartagena De Indias", "Pinohia", " Matavera District", "GallatGateway", "Cockermouth", "Baltar", "Nea Artaki", "Placida", "Carrying Place", "Château-d’Œx",
   "Pucón", "Polson", "Camara de Lobos", "Asheville", "Lakeport", "Mérida", "Koksijde", "Tedburn St Mary", "Rainbow Bay", "Sacavem", "Chalikounas", "Hella", "Westerlo", "Kato Agios Markos", "Kuta Utara", "Pampilhosa da Serra", "Fez", "Bastimento", "Nazaré Paulista", "Premia de Dalt", "Guimaraes", "Cabarete", "Puymaurin", "Playa Agua Blanca", "Hull", "Deming", "Flic en Flac", "Breckenridge", "Budapest", "Harihari", "Haast", "Parede", "Abiquiu", "Rijeka", "Naples",
   "Pataua South", "Sao Martinho do Porto", "Bryson City", "Santa Margalida", "Vila Cha", "Hato Damas", "Tuineje", "Pontevedra", "Fiumara", "Alesund", "Belajske Poljice", "Franklin", "Xerokampos", "guesthouse in San Marcos La Laguna", "Pouzauges", "Montevarchi", "Zamboanguita", "Mabank", "Curacautín", "Saint-Côme", "bed and breakfast Praia de Araçatiba", "Falcon", "Nicholls Town", "Borrisoleigh", "Sudbury", "Vila Nova de Milfontes", "Charneca de Caparica", "Los Barriles", "Westchester Station", "Graz", "Juan de Fuca", "Alicante", "Braunwald", "Oaxaca", "Aguadulce", "Moorang", "Broken Bow", "Apulo", "Cala Morell", "Almancil", "Budens", "Helensville", "Morillon", "Corregimiento de Isla Grande", "Aylesford",
   "Ahwahnee", "Prague", "Springbrook", "Mesitas del Colegio", "Saulce-sur-Rhône", "Gianyar", "Beguildy", "Red Lodge", "Tomares", "Alto Paraíso de Goiás", "Antigua", "Mont-roig del Camp", "Campiglia Marittima", "Wyuna Bay", "Oruanui", "Le Plessis-Robinson", "Washington", "Messines", "Paul do Mar", "Esplugues de Llobregat", "Benitachell", "Loon", "Deerwood", "Braga", "Bungaree", "Invermere", "Skopje", "Panama City", "San Isidro", "Athens", "San Jose City", "Portoscuso", "Corroios", "Platanias", "Kokatahi", "Dhaka", "Peñol", "Aheloy", "hostel Zipolite", "Paredes", "El Sargento",
   "Armenoi", "Belaye", "Menangle", "Puerto Escondido", "Chicama", "Cashmere", "Toroni", "Duck", "Brunswick Heads", "Daylesford", "Temecula", "Oía", "สะพานพระโขนง (Phra Kanong Bridge)", "Olhos de Agua", "Ribadesella", "Atins", "Melo", "North Bay", "Luray", "Costa Teguise", "Sineu", "Praha", "in Murphy", "Alella", "Vieques", "Salt Lake City", "San José del Cabo", "Eleuthera", "Petite-Rivière-Saint-François", "Panamá", "El Roque", "Camaroncito", "Bayahíbe", "New South Wales", "Boyeruca", "Cook Islands", "Australia", "Italy", "Dominican Republic", "Barbados", "Iceland", "Florida", "Kenya", "Bangladesh", "Portugal", "Sweden", "Bosnia and Herzegovina", "India", "Bulgaria", "Madagascar", "Namibia", "Costa Rica", "Crete", "Maine", "St. Lucia", "Bahamas", "Sri Lanka", "Czech Republic", "Czechia", "Turkey", "Austria", "Honduras", "El Salvador", "Morocco", "Mauritius", "Albania", "Slovakia", "Denmark", "Japan", "Belgium", "Norway", "Hungary", "Puerto Escondido, Mexico", "Chile", "France", "United States", "United Kingdom", "Serbia", "Aruba", "Vietnam", "Dominica", "United Arab Emirates", "New Zealand",
   "China", "Egypt", "Spain", "Germany", "Malaysia", "Botswana", "Trinidad and Tobago", "Nicaragua", "Paraguay", "Argentina", "Peru", "Croatia", "Colorado", "North Macedonia", "Ireland", "Nigeria", "Canada", "Guatemala", "Ghana", "Puerto Rico", "Malta", "Finland", "Lithuania", "Mexico", "Guadeloupe", "Bermuda", "Panama", "South Africa", "Montenegro", "Thailand", "Greece", "Indonesia", "US Virgin Islands", "Cyprus", "Isle of Man", "Luxembourg", "Poland", "Jamaica", "Taiwan", "Ecuador", "Slovenia", "Colombia", "Brazil", "South Korea", "Georgia", "England", "Switzerland", "Netherlands", "Romania", "Belize", "Philippines", "Uruguay", "Mozambique"
 ];

}
