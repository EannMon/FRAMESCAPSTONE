# test_db.py
import mysql.connector
from db_config import DB_CONFIG

print("-------------------------------------------------")
print("📡 Testing Connection to Aiven Cloud Database...")
print("-------------------------------------------------")

try:
    # Subukang kumonek gamit ang settings sa db_config.py
    conn = mysql.connector.connect(**DB_CONFIG)
    
    if conn.is_connected():
        print("✅ SUCCESS! Connected ka na sa Aiven!")
        print(f"🔗 Connected to Database: {DB_CONFIG['database']}")
        print(f"🖥️  Host: {DB_CONFIG['host']}")
        
        # (Optional) Try natin mag-query ng version para sure
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"📊 MySQL Version: {version[0]}")
        
        conn.close()
    else:
        print("❌ Failed: Hindi connected.")

except mysql.connector.Error as err:
    print(f"❌ DATABASE ERROR: {err}")
except Exception as e:
    print(f"❌ GENERAL ERROR: {e}")

print("-------------------------------------------------")