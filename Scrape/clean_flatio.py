import pandas as pd
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore
import time
import re
import unidecode
from retrying import retry
from selenium import webdriver
import json
import math

# Initialize Firebase
cred = credentials.Certificate("/Users/adamk/Documents/TheWiredNomad/thewirednomad-firebase-adminsdk-6p9vv-82973593b3.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://thewirednomad-default-rtdb.firebaseio.com'
})
db = firestore.client()
# Set your ChromeDriver path
DRIVER_PATH = "/Users/adamk/Downloads/chromedriver-mac-x64/chromedriver"

# Function to scrape country from URL
def scrape_country_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the ul with class "breadcrumbs"
        ul_element = soup.find('ul', class_='breadcrumbs')
        if ul_element:
            # Get the second href
            hrefs = ul_element.find_all('a')
            if len(hrefs) > 1:
                print(hrefs[1].text.strip())
                return hrefs[1].text.strip()
    except requests.RequestException:
        pass
    return None

# Function to add countries to CSV
def add_countries_to_csv(csv_file_path, output_file_path):
    df = pd.read_csv(csv_file_path)

    # Add a new column with scraped countries
    df['countries'] = df['url'].apply(scrape_country_from_url)

    # Save the DataFrame with the new column to a new CSV file
    df.to_csv(output_file_path, index=False)

# Function to update city field in Firestore
def update_city_field_in_firestore():
    # Query all documents in 'feedbacks' collection
    docs = db.collection('feedbacks').stream()

    for doc in docs:
        doc_data = doc.to_dict()
        if 'flatioLink' in doc_data and doc_data['flatioLink']:
            city_name = doc_data.get('city', '')

            # Check if "from" is in the city name
            if " from" in city_name:
                # Remove "from" and update the document in Firestore
                updated_city_name = city_name.replace(" from", "").strip()
                doc.reference.update({
                    "city": updated_city_name
                })
                print(f"Updated city for {doc_data['flatioLink']}: {updated_city_name}")

# Function to fetch coordinates from Mapbox
def get_lat_lng(city, country):
    endpoint = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{city}, {country}.json"
    params = {
        'access_token': MAPBOX_ACCESS_TOKEN,
        'limit': 1
    }

    response = requests.get(endpoint, params=params)

    if response.status_code != 200:
        print(f"Failed to fetch coordinates for {city}, {country}. HTTP Status: {response.status_code}. Response: {response.text}")
        return None, None

    data = response.json()

    # Extract the coordinates (longitude, latitude) for the first result
    if data.get('features'):
        coordinates = data['features'][0]['geometry']['coordinates']
        return coordinates[1], coordinates[0]  # Return as (latitude, longitude)
    else:
        print(f"No geocoding data found for {city}, {country}. Response: {data}")
        return None, None

# Function to update Firestore documents with coordinates
def update_firestore_documents():
    # Fetch documents from Firestore that have a 'flatioLink' but lack 'latitude' and 'longitude'
    documents = db.collection('feedbacks').where('flatioLink', '!=', '').stream()

    for doc in documents:
        data = doc.to_dict()

        # Only process if latitude and longitude are missing
        if not data.get("latitude") and not data.get("longitude"):
            city = data.get("city")
            country = data.get("country")

            if city and country:
                print(f"Fetching coordinates for: {city}, {country}...")
                latitude, longitude = get_lat_lng(city, country)

                # Only update if latitude and longitude are successfully fetched
                if latitude and longitude:
                    doc.reference.update({
                        "latitude": latitude,
                        "longitude": longitude
                    })
                    print(f"Updated coordinates for: {city}, {country} to Lat: {latitude}, Lon: {longitude}")
                else:
                    print(f"Failed to fetch coordinates for: {city}, {country}")
            else:
                print(f"City or country missing for document with flatioLink: {data.get('flatioLink')}")
        else:
            print(f"Document with flatioLink: {data.get('flatioLink')} already has latitude and longitude.")

# Function to create Firebase documents from CSV
def create_firebase_documents_from_csv(csv_file_path):
    df = pd.read_csv(csv_file_path)
    documents = []

    for _, row in df.iterrows():
        match = re.search(r"Rent (.*?)\d", row["title"])
        city = match.group(1).strip() if match else ""
        city_ascii = unidecode.unidecode(city)

        try:
            download_speed = int(''.join(filter(str.isdigit, row.get("download_speed", "")))) if "download_speed" in row else "N/A"
        except ValueError:
            download_speed = 0

        try:
            upload_speed = int(''.join(filter(str.isdigit, row.get("upload_speed", "")))) if "upload_speed" in row else "N/A"
        except ValueError:
            upload_speed = 0

        document = {
            "downloadSpeed": download_speed,
            "uploadSpeed": upload_speed,
            "pingSpeed": 30,
            "flatioLink": row["url"],
            "city": city_ascii.strip(),
            "country": row["countries"],
            "vpn": "no",
            "isHost": True,
            "ethernetLength": "",
            "additionalDetails": "",
            "dropouts": "no",
            "openLanPorts": "no",
            "websiteUsed": "speedtest",
            "timestamp": int(time.time())
        }
        documents.append(document)
        print(document)
    return documents

# Function to push documents to Firebase
def push_to_firebase(documents):
    for doc in documents:
        try:
            db.collection('feedbacks').add(doc)
            print(f"Added document for {doc['flatioLink']}")
        except Exception as e:
            print(f"Error adding document for {doc['flatioLink']}: {e}")

# Set your Mapbox access token
MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidGhld2lyZWRub21hZCIsImEiOiJjbG11amVhMWIwZDgyMmlxd28xYmszMGszIn0.h6_NuIpjNunLklVN4XYoHA'

# Call the functions
add_countries_to_csv('/Users/adamk/Documents/Scrape/results.csv', '/Users/adamk/Documents/Scrape/output.csv')
# Call additional functions
documents = create_firebase_documents_from_csv('/Users/adamk/Documents/Scrape/output.csv')
push_to_firebase(documents)

update_firestore_documents()
update_city_field_in_firestore()

# List of document IDs to skip
#document_IDs = []

# Function to convert currency to USD and daily rate
def convert_currency_and_rate(currency, value):
    # Replace this with actual currency conversion rates
    conversion_rate = {"EUR": 1.2}  # Example: 1 EUR = 1.2 USD

    # Convert to USD
    usd_value = value * conversion_rate.get(currency, 1)

    # Convert to daily rate
    daily_rate = usd_value / 30

    return daily_rate

# Function to update documents in the "feedbacks" collection with retry logic
@retry(wait_fixed=1000, stop_max_attempt_number=3)
def update_feedbacks():
    # Fetch documents from "feedbacks" collection with an increased timeout
    feedbacks_ref = db.collection("feedbacks")
    feedbacks = feedbacks_ref.stream(timeout=120)

    for feedback in feedbacks:
        # Skip if document ID is in the exclusion list
        # if feedback.id in document_IDs:
        #     print(f"Skipping document ID: {feedback.id}")
        #     continue

        print(f"Processing feedback document with ID: {feedback.id}")
        data = feedback.to_dict()

        # Check if the document contains "flatioLink" field
        if "flatioLink" in data:
            flatio_link = data["flatioLink"]

            # Extract the listing code from the flatio link
            listing_code = flatio_link.split("/")[-1].split("?")[0]

            print(f"Listing Code extracted: {listing_code}")

            # Read the JSON file directly only if the "price" field is absent
            if "price" not in data:
                # Read the JSON file directly
                with open("/Users/adamk/Documents/TheWiredNomad/thewirednomad.json", 'r') as json_file:
                    json_data = json.load(json_file)

                print(f"JSON file loaded successfully")

                # Find the entry with matching listing code
                matching_entry = next(
                    (
                        entry
                        for entry in json_data
                        if "full_listing_url" in entry
                        and (
                            entry["full_listing_url"]["en"].startswith(f"https://www.flatio.com/rent/apartment/{listing_code}")
                            or entry["full_listing_url"]["en"].startswith(f"https://www.flatio.com/rent/house/{listing_code}")
                            or entry["full_listing_url"]["en"].startswith(f"https://www.flatio.com/rent/room/{listing_code}")
                        )
                    ),
                    None,
                )

                if matching_entry and "price" in matching_entry:
                    currency = matching_entry["price"]["currency"]
                    value = matching_entry["price"]["value"]

                    # Convert currency and calculate daily rate
                    daily_rate = convert_currency_and_rate(currency, value)

                    # Round up to the nearest whole number
                    rounded_price = math.ceil(daily_rate)

                    # Update the Firestore document with the calculated price
                    feedback_ref = feedbacks_ref.document(feedback.id)
                    feedback_ref.update({"price": rounded_price})

                    print(f"Price added successfully for document ID: {feedback.id}. Rounded price: {rounded_price}")
                else:
                    print(f"No matching entry found or no 'price' in the entry for document ID: {feedback.id}")
            else:
                print(f"Price field already exists for document ID: {feedback.id}. No update needed.")

# Call the update_feedbacks function with retry logic
update_feedbacks()
