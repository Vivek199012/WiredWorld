import firebase_admin
from firebase_admin import credentials, firestore
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
import time
import re
from datetime import datetime, timedelta

DRIVER_PATH = "/usr/bin/chromedriver"  # Change to your path

# Initialize Firebase
cred = credentials.Certificate("thewirednomad-firebase-adminsdk-6p9vv-82973593b3.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://thewirednomad-default-rtdb.firebaseio.com'
})

# Initialize Firestore client
db = firestore.client()

# File to store links with no rating
NO_RATING_LINKS_FILE = "links.txt"

# Function to extract rating number from HTML content
def extract_rating_number(html):
    soup = BeautifulSoup(html, 'html.parser')
    parent_div = soup.find('div', class_='a8jhwcl atm_c8_vvn7el atm_g3_k2d186 atm_fr_1vi102y atm_9s_1txwivl atm_ar_1bp4okc atm_h_1h6ojuz atm_cx_t94yts atm_le_14y27yu atm_c8_sz6sci__14195v1 atm_g3_17zsb9a__14195v1 atm_fr_kzfbxz__14195v1 atm_cx_1l7b3ar__14195v1 atm_le_1l7b3ar__14195v1 dir dir-ltr')
    if parent_div:
        rating_div = parent_div.find('div', {'aria-hidden': 'true'})
        if rating_div:
            return rating_div.text.strip()
    rating_element = soup.find('div', class_='r1lutz1s')
    if rating_element:
        return rating_element.text.strip()
    return None

# Function to scrape rating
def scrape_rating(airbnb_link, browser):
    print(f"Scraping rating for {airbnb_link}")
    browser.get(airbnb_link)
    time.sleep(5)  # Adjust the delay time as needed
    html_content = browser.page_source
    rating_number = extract_rating_number(html_content)
    print(f"Extracted rating: {rating_number}")
    return rating_number

# Function to extract available dates from the calendar
def extract_available_dates(browser):
    xpath = '//div[@aria-label="Calendar"]//div[@data-testid]'
    available_dates = []
    for item in browser.find_elements(By.XPATH, xpath):
        date = item.get_attribute("data-testid")
        blocked = item.get_attribute("data-is-day-blocked")
        if blocked == "false" and "calendar-day" in date:
            date_str = date.split('-')[-1]
            available_dates.append(datetime.strptime(date_str, '%m/%d/%Y'))
    return available_dates

# Function to format dates
def format_date(date):
    return date.strftime('%Y-%m-%d')

# Function to generate new Airbnb link with dates
def generate_airbnb_link_with_dates(airbnb_link, check_in_date, check_out_date):
    formatted_check_in = format_date(check_in_date)
    formatted_check_out = format_date(check_out_date)
    return f"{airbnb_link}?check_in={formatted_check_in}&guests=1&adults=1&check_out={formatted_check_out}"

# Function to scrape price
def scrape_price(airbnb_link, browser):
    print(f"Scraping price for {airbnb_link}")
    browser.get(airbnb_link)
    time.sleep(5)  # Adjust the delay time as needed
    available_dates = extract_available_dates(browser)
    available_dates.sort()
    price = None
    attempts = 0
    max_attempts = 3

    for i in range(len(available_dates)):
        if attempts >= max_attempts:
            break

        if i + 7 < len(available_dates):
            start_date = available_dates[i]
            end_date = available_dates[i + 7]
            new_airbnb_link = generate_airbnb_link_with_dates(airbnb_link, start_date, end_date)
            print(f"Navigating to new URL with dates: {new_airbnb_link}")

            try:
                browser.get(new_airbnb_link)
                time.sleep(5)  # Adjust the delay time as needed

                # Wait until the price block loads
                timeout = 25
                expectation = EC.presence_of_element_located((By.CSS_SELECTOR, 'span._1y74zjx'))
                price_element = WebDriverWait(browser, timeout).until(expectation)
                print("Price element found.")  # Debugging line
                price_text = price_element.get_attribute('innerHTML')
                print(f"Price element text: {price_text}")  # Debugging line
                scraped_price = int(re.search(r'(\d+)', price_text).group(0))  # Convert to integer

                price = scraped_price
                break  # Exit the loop if successful
            except TimeoutException:
                print(f"Failed to load price for dates: {format_date(start_date)} - {format_date(end_date)}. Retrying with different dates.")
                attempts += 1
                continue  # Retry with the next available start date
            except Exception as e:
                print(f"Error extracting price: {e}")
                attempts += 1
                continue

    return price

# Function to read no rating links from file
def read_no_rating_links(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file.readlines()]

# Function to write no rating links to file
def write_no_rating_link(file_path, link):
    with open(file_path, 'a') as file:
        file.write(f"{link}\n")

# Read the list of links with no ratings from the file
no_rating_links = read_no_rating_links(NO_RATING_LINKS_FILE)

# Setup Selenium for scraping
options = webdriver.ChromeOptions()
options.add_argument('--headless')
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
options.add_argument(f'user-agent={user_agent}')
service = Service(executable_path=DRIVER_PATH)

# Fetch documents from Firebase collection "feedbacks" with 'airbnbLink' field
feedbacks_ref = db.collection('feedbacks')
query = feedbacks_ref.where('airbnbLink', '!=', '').stream()

# Create a browser instance for scraping
with webdriver.Chrome(service=service, options=options) as browser:
    for feedback in query:
        feedback_dict = feedback.to_dict()

        # Check for 'airbnbLink' in feedback_dict and ensure it's not empty
        if 'airbnbLink' in feedback_dict and feedback_dict['airbnbLink'].strip():
            airbnb_link = feedback_dict['airbnbLink']
            rating = feedback_dict.get('rating')
            price = feedback_dict.get('price')

            # Skip scraping for links in the links.txt
            if airbnb_link in no_rating_links:
                print(f"Skipping link with no rating: {airbnb_link}")
                continue

            # Track if scraping attempts were made
            rating_attempted = False
            price_attempted = False

            # Scrape rating if not already present
            if rating is None:
                rating_number = scrape_rating(airbnb_link, browser)
                if rating_number:
                    feedback.reference.update({'rating': rating_number})
                rating_attempted = True

            # Scrape price if not already present
            if price is None:
                scraped_price = scrape_price(airbnb_link, browser)
                if scraped_price:
                    feedback.reference.update({'price': scraped_price})
                price_attempted = True

            # Write the link to links.txt if both scraping attempts were made
            if rating_attempted and price_attempted:
                write_no_rating_link(NO_RATING_LINKS_FILE, airbnb_link)
