import os
import random
import requests
from bs4 import BeautifulSoup
from firebase_admin import credentials, firestore, storage
import firebase_admin

class AirbnbScraper:
    def __init__(self, destination_folder):
        self.destination_folder = destination_folder
        if not os.path.exists(destination_folder):
            os.makedirs(destination_folder)
        # Initialize Firebase app (you need to provide the path to your service account key JSON file)
        cred = credentials.Certificate("thewirednomad-firebase-adminsdk-6p9vv-82973593b3.json")
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'thewirednomad.appspot.com'
        })
        self.db = firestore.client()
        self.bucket = storage.bucket()

    def get_airbnb_links_from_firestore(self):
        # Retrieve documents from the "feedbacks" collection
        feedbacks_ref = self.db.collection("feedbacks")
        query = feedbacks_ref.where("airbnbLink", "!=", "").stream()  # Only documents with non-empty "airbnbLink" field
        airbnb_links = [(doc.id, doc.get("airbnbLink")) for doc in query]
        return airbnb_links

    def get_first_image_link(self, url):
        headers = {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
        }
        try:
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            # Find the first image tag with class 'itu7ddv'
            image_tag = soup.find('img', class_='itu7ddv')
            if image_tag:
                # Extract image URL from 'src' attribute
                return image_tag.get('src')
        except requests.exceptions.RequestException as e:
            print(f"Failed to get image link due to {e}")
        return None

    def download_and_upload_image(self, image_url):
        if not image_url:
            print("No image link found.")
            return None

        try:
            response = requests.get(image_url)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to connect to url {image_url}, due to {e}")
            return None

        image_name = image_url.split("/")[-1].split("?")[0]  # Extract file name and remove query parameters
        image_path = os.path.join(self.destination_folder, image_name)

        with open(image_path, 'wb') as f:
            f.write(response.content)

        # Upload image to Cloud Storage
        blob = self.bucket.blob(image_name)
        blob.upload_from_filename(image_path)

        # Get the URL of the uploaded image
        image_url_gs = blob.public_url

        print('Image successfully uploaded to Cloud Storage:', image_url_gs)
        return image_url_gs

    def update_document_with_image_url(self, doc_id, image_url):
        if not doc_id or not image_url:
            print("Invalid arguments.")
            return
        # Update Firestore document with the Cloud Storage image URL
        doc_ref = self.db.collection("feedbacks").document(doc_id)
        doc_ref.update({"imageUrl": image_url})
        print(f"Image URL attached to document '{doc_id}' successfully.")

    def scrape_airbnb(self, airbnb_links):
        for doc_id, airbnb_link in airbnb_links:
            if airbnb_link:
                image_url = self.get_first_image_link(airbnb_link)
                if image_url:
                    image_url_gs = self.download_and_upload_image(image_url)
                    if image_url_gs:
                        self.update_document_with_image_url(doc_id, image_url_gs)
            else:
                print(f"No Airbnb link found for document '{doc_id}'.")

def main():
    destination_folder = 'airbnb_home_photos' + str(random.randint(0, 1000))
    scraper = AirbnbScraper(destination_folder)
    airbnb_links = scraper.get_airbnb_links_from_firestore()
    scraper.scrape_airbnb(airbnb_links)

if __name__ == "__main__":
    main()
