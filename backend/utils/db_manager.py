from pymongo import MongoClient
from config import Config
from datetime import datetime 
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    """
    Manages multi-tenant database connections
    Each user gets their own database
    """
    
    # MongoDB client
    _client = None
    _main_connection = None
    
    @classmethod
    def get_client(cls):
        """Get MongoDB client instance"""
        if cls._client is None:
            cls._client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
        return cls._client
    
    @classmethod
    def get_main_db(cls):
        """
        Get main database connection
        Used for user authentication and shared data
        """
        if cls._main_connection is None:
            client = cls.get_client()
            cls._main_connection = client[Config.MONGO_MAIN_DB]
        return cls._main_connection
    
    @classmethod
    def get_user_db(cls, user_id):
        """
        Get user-specific database connection
        Database name format: warehouse_user_{user_id}
        
        Args:
            user_id (str): MongoDB ObjectId of user
        
        Returns:
            Database connection for the user
        """
        client = cls.get_client()
        db_name = f'warehouse_user_{user_id}'
        return client[db_name]
    
    @classmethod
    def create_user_db(cls, user_id):
        """
        Create a new user database with collections and indexes
        
        Args:
            user_id (str): MongoDB ObjectId of user
        
        Returns:
            Database connection
        """
        try:
            db = cls.get_user_db(user_id)
            
            # Create collections with indexes
            # Products collection
            db.create_collection('products')
            db['products'].create_index('sku', unique=True)
            db['products'].create_index('name')
            db['products'].create_index('category_id')
            
            # Categories collection
            db.create_collection('categories')
            db['categories'].create_index('name', unique=True)
            
            # Inventory logs collection
            db.create_collection('inventory_logs')
            db['inventory_logs'].create_index('product_id')
            db['inventory_logs'].create_index('created_at')
            
            # Sales orders collection
            db.create_collection('sales_orders')
            db['sales_orders'].create_index('order_number', unique=True)
            db['sales_orders'].create_index('created_at')
            
            # Invoices collection
            db.create_collection('invoices')
            db['invoices'].create_index('invoice_number', unique=True)
            db['invoices'].create_index('order_id')
            
            # Reports/Analytics collection
            db.create_collection('analytics')
            db['analytics'].create_index('date')
            
            print(f"✓ Database created for user {user_id}")
            return db
        except Exception as e:
            print(f"Error creating user database: {str(e)}")
            return cls.get_user_db(user_id)
    
    @classmethod
    def delete_user_db(cls, user_id):
        """
        Delete user database (when account is deleted)
        
        Args:
            user_id (str): MongoDB ObjectId of user
        
        Returns:
            bool: True if deleted successfully
        """
        try:
            client = cls.get_client()
            db_name = f'warehouse_user_{user_id}'
            client.drop_database(db_name)
            print(f"✓ Database deleted for user {user_id}")
            return True
        except Exception as e:
            print(f"Error deleting user database: {str(e)}")
            return False
    
    @classmethod
    def backup_user_db(cls, user_id):
        """
        Backup user database (creates a copy)
        
        Args:
            user_id (str): MongoDB ObjectId of user
        
        Returns:
            bool: True if backed up successfully
        """
        try:
            client = cls.get_client()
            db_name = f'warehouse_user_{user_id}'
            backup_name = f'{db_name}_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            
            # Copy database
            admin = client.admin
            admin.command('copydb', fromdb=db_name, todb=backup_name)
            
            print(f"✓ Database backed up for user {user_id}")
            return True
        except Exception as e:
            print(f"Error backing up user database: {str(e)}")
            return False