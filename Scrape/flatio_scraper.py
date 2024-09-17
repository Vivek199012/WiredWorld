import requests
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import time
import random
import csv
import firebase_admin
from firebase_admin import credentials, firestore
from urllib.parse import urlparse, urlunparse

DRIVER_PATH = "/usr/bin/chromedriver"  # Change to your path

# Initialize Firebase
cred = credentials.Certificate("thewirednomad-firebase-adminsdk-6p9vv-82973593b3.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://thewirednomad-default-rtdb.firebaseio.com'
})

def scrape_listing(browser, listing_url):
    try:
        print(f"Scraping listing: {listing_url}")
        browser.get(listing_url)
        time.sleep(2)
        soup = BeautifulSoup(browser.page_source, 'html.parser')

        # Check if the specified div class exists
        internet_speed_notification = soup.find("div", class_="internet-speed__notification")
        verified = "TRUE" if internet_speed_notification else "FALSE"

        # Get speeds
        speed_elements = soup.find_all("p", class_="internet-speed__value")
        download_speed = speed_elements[0].text.strip() if speed_elements and len(speed_elements) > 0 else "N/A"
        upload_speed = speed_elements[1].text.strip() if speed_elements and len(speed_elements) > 1 else "N/A"

        # Get listing title
        title = browser.title

        return {
            'url': listing_url,
            'download_speed': download_speed,
            'upload_speed': upload_speed,
            'title': title,
            'verified': [verified]
        }

    except WebDriverException as e:
        print(f"WebDriverException: {e}")
        if "502 Bad Gateway" in str(e):
            raise requests.exceptions.RequestException(f"502 Bad Gateway error: {e}")
        else:
            raise

# Fetch all Flatio links from Firestore and store them in a set
def get_flatio_links():
    db = firestore.client()
    documents = db.collection('feedbacks').where('flatioLink', '>', '').stream()
    flatio_links = {doc.to_dict()["flatioLink"].strip().lower() for doc in documents}
    return flatio_links

# Check if the given link exists in the pre-fetched set of Flatio links
def link_exists_in_firebase(link, flatio_links):
    normalized_link = link.strip().lower()
    return normalized_link in flatio_links


def scrape_flat_links():
    print("Fetching flat links...")
    # Send a GET request to the starting URL
    response = requests.get("https://www.flatio.com/", allow_redirects=True)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Parse the HTML content with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the swiper container
        swiper_container = soup.find('div', class_='js-footer-seo-swiper')

        # Find all links within the swiper container
        links = swiper_container.find_all('a', class_='footer-flp-title')

        # Initialize an empty list to store the extracted links
        listings = []

        # Set to keep track of encountered links
        encountered_links = set()

        # Iterate over the links
        for link in links:
            # Get the href attribute from the anchor tag
            href = link.get('href', '')

            # Send a GET request to each link
            try:
                #print(f"Fetching individual link: {href}")
                link_response = requests.get(href, allow_redirects=True)
                if link_response.status_code == 200:
                    link_soup = BeautifulSoup(link_response.content, 'html.parser')
                    # Find the divs with specified class containing the desired anchor tags
                    #divs = link_soup.find_all('div', class_='info-container-sub info-container-sub--first d-flex-column')
                    divs = link_soup.find_all('div', class_='info-container-sub info-container-sub--first u-d-flex-column')
                    # Iterate over the divs
                    for div in divs:
                        # Find all anchor tags within the div with specified class and attributes
                        rental_links = div.find_all('a', class_='u-text-no-decoration', target='_blank')

                        # Extract href attributes from the links and append to the listings
                        for rental_link in rental_links:
                            listing_href = rental_link.get('href', '')
                            # Remove query parameters from the URL
                            listing_href = remove_query_parameters(listing_href)
                            if listing_href not in encountered_links:
                                listings.append(listing_href)
                                encountered_links.add(listing_href)
                                print("Fetched listing: ", listing_href)
                                # Stop the loop if a previously found link is encountered
                                break

                else:
                    print(f"Failed to fetch individual link {href}. Status code: {link_response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"Error fetching link {href}: {e}")

        return listings

    else:
        # Print an error message if the request was not successful
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return []

def remove_query_parameters(url):
    # Parse the URL
    parsed_url = urlparse(url)
    # Reconstruct the URL without query parameters
    url_without_query = urlunparse(parsed_url._replace(query=''))
    return url_without_query


def main():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    options.add_argument(f'user-agent={user_agent}')
    service = Service(executable_path=DRIVER_PATH)

    all_flatio_links = get_flatio_links()

    with webdriver.Chrome(service=service, options=options) as browser:
        with open('results.csv', 'w', newline='') as csvfile:
            fieldnames = ['url', 'download_speed', 'upload_speed', 'image_link', 'title', 'verified']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            processed_links = set()  # Set to keep track of already processed links

            listings = scrape_flat_links()
            print(listings)

            for listing in listings:
                try:
                    print("Trying to see if link exists...")
                    # Check if the link has already been processed
                    if link_exists_in_firebase(listing, all_flatio_links) or listing in processed_links:
                        print("Link exists in Firebase already.")
                        continue

                    # If not, proceed with scraping
                    print("link doesn't exist")
                    try:
                        result = scrape_listing(browser, listing)
                    except WebDriverException:
                        time.sleep(60)  # wait for 60 seconds
                        continue

                except requests.exceptions.RequestException as e:
                    print(f"Error: {e}")
                    if "502 Bad Gateway" in str(e):
                        print("Encountered a 502 Bad Gateway error. Stopping the script.")
                        break
                    else:
                        continue
                # Add the link to the set of processed links
                processed_links.add(listing)

                time.sleep(random.uniform(2, 5))  # Random delay between 2 to 5 seconds

                if result['download_speed'] not in ['N/A Mbps','N/A'] and result['upload_speed'] not in ['N/A Mbps','N/A']:
                    upload_speed_str = result['upload_speed']
                    download_speed_str = result['download_speed']

                    # Use regular expression to extract numeric part
                    upload_speed_match = re.search(r'\d+', upload_speed_str)
                    download_speed_match = re.search(r'\d+', download_speed_str)

                    # Check if a match was found and extract the numeric part
                    upload_speed_numeric = int(upload_speed_match.group()) if upload_speed_match else None
                    download_speed_numeric = int(download_speed_match.group()) if download_speed_match else None

                    if download_speed_numeric >= 10 and upload_speed_numeric >= 5:
                        writer.writerow(result)  # Write the result to the CSV file
                        csvfile.flush()  # Optional: Manually flush the data to the file
                        print(result)  # Print the result to the console
                    else:
                        print("Download and/or upload speed is too slow.")
                else:
                    print("No internet speeds found for listing:")
                    print(result['url'])


if __name__ == "__main__":
    main()
