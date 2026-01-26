import mysql.connector
from db_config import DB_CONFIG

# --- ILAGAY ANG EMAIL MO DITO ---
MY_EMAIL = "rose@gmail.com" 
# (Siguraduhin na ito yung email na niregister mo kanina)

try:
    print("🔌 Connecting to database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # I-update ang status mo to 'Head'
    sql = "UPDATE User SET faculty_status = 'Head' WHERE email = %s"
    cursor.execute(sql, (MY_EMAIL,))
    conn.commit()

    if cursor.rowcount > 0:
        print(f"✅ SUCCESS! Si {MY_EMAIL} ay isa nang Department Head.")
    else:
        print(f"❌ Wala pong nangyari. Sigurado ka bang tama ang email na '{MY_EMAIL}'?")

except Exception as e:
    print(f"❌ Error: {e}")

finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()