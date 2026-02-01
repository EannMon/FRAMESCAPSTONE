import os
from dotenv import load_dotenv

# Load the secret variables from the .env file
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),       # Cloud DBs use special ports (not 3306)
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'), 
    'database': os.getenv('DB_NAME'),   # This will be 'defaultdb'
    'ssl_ca': 'ca.pem',                 # The certificate file you downloaded earlier
    'ssl_disabled': False
}