from datetime import datetime
from bson.objectid import ObjectId
from utils.db_manager import DatabaseManager

class Inventory:
    """Inventory model for database operations"""
    
    def __init__(self, user_id):
        """
        Initialize inventory manager for specific user
        
        Args:
            user_id (str): MongoDB ObjectId of user
        """
        self.user_id = user_id
        self.db = DatabaseManager.get_user_db(user_id)
        self.products_collection = self.db['products']
        self.categories_collection = self.db['categories']
        self.inventory_logs_collection = self.db['inventory_logs']

    # ===================== PRODUCT OPERATIONS =====================

    def create_product(self, name, sku, category_id, price, quantity, min_stock, description, created_by):
        """Create a new product"""
        try:
            product_data = {
                'name': name,
                'sku': sku,
                'category_id': ObjectId(category_id) if category_id else None,
                'price': float(price),
                'quantity': int(quantity),
                'min_stock': int(min_stock),
                'description': description,
                'created_by': ObjectId(created_by),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_active': True
            }
            
            result = self.products_collection.insert_one(product_data)
            if result.inserted_id:
                product_data['_id'] = str(result.inserted_id)
                if product_data['category_id']:
                    product_data['category_id'] = str(product_data['category_id'])
                product_data['created_by'] = str(product_data['created_by'])
                return product_data
            return None
        except Exception as e:
            print(f"Error creating product: {str(e)}")
            return None

    def find_product_by_id(self, product_id):
        """Find product by ID"""
        try:
            product = self.products_collection.find_one({'_id': ObjectId(product_id)})
            if product:
                product['_id'] = str(product['_id'])
                if product.get('category_id'):
                    product['category_id'] = str(product['category_id'])
                product['created_by'] = str(product['created_by'])
            return product
        except:
            return None

    def find_product_by_sku(self, sku):
        """Find product by SKU"""
        product = self.products_collection.find_one({'sku': sku})
        if product:
            product['_id'] = str(product['_id'])
            if product.get('category_id'):
                product['category_id'] = str(product['category_id'])
            product['created_by'] = str(product['created_by'])
        return product

    def get_all_products(self, page=1, per_page=10, search=None, category_id=None, is_active=True):
        """Get all products with pagination and filtering"""
        try:
            query = {'is_active': is_active}
            
            if search:
                query['name'] = {'$regex': search, '$options': 'i'}
            
            if category_id:
                try:
                    query['category_id'] = ObjectId(category_id)
                except:
                    pass
            
            total_count = self.products_collection.count_documents(query)
            
            skip = (page - 1) * per_page
            products = list(self.products_collection.find(query)
                          .skip(skip)
                          .limit(per_page)
                          .sort('name', 1))
            
            for product in products:
                product['_id'] = str(product['_id'])
                if product.get('category_id'):
                    product['category_id'] = str(product['category_id'])
                product['created_by'] = str(product['created_by'])
            
            return products, total_count
        except Exception as e:
            print(f"Error getting products: {str(e)}")
            return [], 0

    def search_products(self, search_query, limit=10):
        """Search products by name or SKU"""
        try:
            query = {
                'is_active': True,
                '$or': [
                    {'name': {'$regex': search_query, '$options': 'i'}},
                    {'sku': {'$regex': search_query, '$options': 'i'}}
                ]
            }
            
            products = list(self.products_collection.find(query).limit(limit))
            
            for product in products:
                product['_id'] = str(product['_id'])
                if product.get('category_id'):
                    product['category_id'] = str(product['category_id'])
                product['created_by'] = str(product['created_by'])
            
            return products
        except Exception as e:
            print(f"Error searching products: {str(e)}")
            return []

    def update_product(self, product_id, update_data, updated_by):
        """Update product information"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            
            if 'category_id' in update_data and update_data['category_id']:
                update_data['category_id'] = ObjectId(update_data['category_id'])
            
            result = self.products_collection.update_one(
                {'_id': ObjectId(product_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating product: {str(e)}")
            return False

    def delete_product(self, product_id, deleted_by=None):
        """Soft delete product"""
        try:
            result = self.products_collection.update_one(
                {'_id': ObjectId(product_id)},
                {'$set': {
                    'is_active': False,
                    'updated_at': datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error deleting product: {str(e)}")
            return False

    def check_sku_exists(self, sku, exclude_product_id=None):
        """Check if SKU already exists"""
        query = {'sku': sku, 'is_active': True}
        
        if exclude_product_id:
            query['_id'] = {'$ne': ObjectId(exclude_product_id)}
        
        return self.products_collection.find_one(query) is not None

    # ===================== CATEGORY OPERATIONS =====================

    def create_category(self, name, description=''):
        """Create a new category"""
        try:
            category_data = {
                'name': name,
                'description': description,
                'created_at': datetime.utcnow()
            }
            
            result = self.categories_collection.insert_one(category_data)
            if result.inserted_id:
                category_data['_id'] = str(result.inserted_id)
                return category_data
            return None
        except Exception as e:
            print(f"Error creating category: {str(e)}")
            return None

    def get_all_categories(self):
        """Get all categories"""
        try:
            categories = list(self.categories_collection.find().sort('name', 1))
            for category in categories:
                category['_id'] = str(category['_id'])
            return categories
        except Exception as e:
            print(f"Error getting categories: {str(e)}")
            return []

    def find_category_by_id(self, category_id):
        """Find category by ID"""
        try:
            category = self.categories_collection.find_one({'_id': ObjectId(category_id)})
            if category:
                category['_id'] = str(category['_id'])
            return category
        except:
            return None

    def update_category(self, category_id, name=None, description=None):
        """Update category"""
        try:
            update_data = {}
            if name:
                update_data['name'] = name
            if description is not None:
                update_data['description'] = description
            
            if not update_data:
                return False
            
            result = self.categories_collection.update_one(
                {'_id': ObjectId(category_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating category: {str(e)}")
            return False

    def delete_category(self, category_id):
        """Delete category"""
        try:
            result = self.categories_collection.delete_one({'_id': ObjectId(category_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting category: {str(e)}")
            return False

    # ===================== STOCK OPERATIONS =====================

    def adjust_stock(self, product_id, quantity_change, reason, user_id):
        """Adjust product stock"""
        try:
            product = self.find_product_by_id(product_id)
            if not product:
                return None
            
            previous_quantity = product['quantity']
            new_quantity = previous_quantity + quantity_change
            
            if new_quantity < 0:
                return None
            
            # Update product quantity
            self.products_collection.update_one(
                {'_id': ObjectId(product_id)},
                {'$set': {
                    'quantity': new_quantity,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            # Log the transaction
            self.inventory_logs_collection.insert_one({
                'product_id': ObjectId(product_id),
                'action': 'ADD' if quantity_change > 0 else 'REMOVE',
                'quantity': abs(quantity_change),
                'previous_quantity': previous_quantity,
                'new_quantity': new_quantity,
                'reason': reason,
                'created_by': ObjectId(user_id),
                'created_at': datetime.utcnow()
            })
            
            return self.find_product_by_id(product_id)
        except Exception as e:
            print(f"Error adjusting stock: {str(e)}")
            return None

    def get_low_stock_items(self):
        """Get products with low stock"""
        try:
            query = {
                'is_active': True,
                '$expr': {'$lt': ['$quantity', '$min_stock']}
            }
            
            products = list(self.products_collection.find(query).sort('quantity', 1))
            
            for product in products:
                product['_id'] = str(product['_id'])
                if product.get('category_id'):
                    product['category_id'] = str(product['category_id'])
                product['created_by'] = str(product['created_by'])
            
            return products
        except Exception as e:
            print(f"Error getting low stock items: {str(e)}")
            return []

    def get_inventory_logs(self, product_id=None, limit=50):
        """Get inventory transaction logs"""
        try:
            query = {}
            if product_id:
                query['product_id'] = ObjectId(product_id)
            
            logs = list(self.inventory_logs_collection.find(query)
                       .sort('created_at', -1)
                       .limit(limit))
            
            for log in logs:
                log['_id'] = str(log['_id'])
                log['product_id'] = str(log['product_id'])
                log['created_by'] = str(log['created_by'])
            
            return logs
        except Exception as e:
            print(f"Error getting inventory logs: {str(e)}")
            return []

    def get_inventory_statistics(self):
        """Get inventory statistics"""
        try:
            total_products = self.products_collection.count_documents({'is_active': True})
            low_stock_count = len(self.get_low_stock_items())
            
            # Total inventory value
            pipeline = [
                {'$match': {'is_active': True}},
                {'$group': {'_id': None, 'total_value': {'$sum': {'$multiply': ['$quantity', '$price']}}}}
            ]
            result = list(self.products_collection.aggregate(pipeline))
            total_value = result[0]['total_value'] if result else 0
            
            return {
                'total_products': total_products,
                'low_stock_count': low_stock_count,
                'total_inventory_value': total_value
            }
        except Exception as e:
            print(f"Error getting statistics: {str(e)}")
            return {}