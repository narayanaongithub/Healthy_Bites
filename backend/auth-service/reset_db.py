import os
import pymysql

def reset_database():
    # Database configuration
    db_user = os.environ.get('DB_USER', 'root')
    db_password = os.environ.get('DB_PASSWORD', 'password')
    db_host = os.environ.get('DB_HOST', 'mysql')
    db_name = os.environ.get('DB_NAME', 'auth_db')
    
    print(f"Connecting to {db_host} as {db_user} for database {db_name}")
    
    try:
        # Connect directly to MySQL
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        
        print("Connection successful!")
        
        with connection.cursor() as cursor:
            # List all tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"Found {len(tables)} tables")
            
            # Disable foreign key checks temporarily
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # Truncate all tables and reset auto-increment
            for table in tables:
                table_name = table[0]
                print(f"Truncating table: {table_name}")
                cursor.execute(f"TRUNCATE TABLE {table_name}")
                print(f"Table {table_name} truncated and auto-increment reset")
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            connection.commit()
            print("\nAll tables have been reset")
        
        connection.close()
        print("Connection closed")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    confirmation = input("⚠️ WARNING: This will delete ALL user accounts and auth data. Type 'YES' to confirm: ")
    if confirmation.upper() == 'YES':
        reset_database()
    else:
        print("Operation cancelled.") 