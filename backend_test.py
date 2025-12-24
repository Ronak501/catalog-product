#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class ProductManagementAPITester:
    def __init__(self, base_url="https://embroidery-mart.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_category_id = None
        self.created_subcategory_id = None
        self.created_product_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
                
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_user_registration_admin(self):
        """Test admin user registration"""
        test_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!",
            "name": "Test Admin",
            "role": "admin"
        }
        
        success, response = self.make_request("POST", "auth/register", test_data, expected_status=200)
        
        if success and "access_token" in response:
            self.admin_token = response["access_token"]
            self.log_test("Admin Registration", True, f"Admin user created: {response['user']['email']}")
            return True
        else:
            self.log_test("Admin Registration", False, "Failed to create admin user", response)
            return False

    def test_user_registration_user(self):
        """Test regular user registration"""
        test_data = {
            "email": f"user_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "UserPass123!",
            "name": "Test User",
            "role": "user"
        }
        
        success, response = self.make_request("POST", "auth/register", test_data, expected_status=200)
        
        if success and "access_token" in response:
            self.user_token = response["access_token"]
            self.log_test("User Registration", True, f"User created: {response['user']['email']}")
            return True
        else:
            self.log_test("User Registration", False, "Failed to create user", response)
            return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # Try to login with admin credentials
        test_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!"
        }
        
        success, response = self.make_request("POST", "auth/login", test_data, expected_status=200)
        
        if success and "access_token" in response:
            self.log_test("User Login", True, f"Login successful for: {response['user']['email']}")
            return True
        else:
            self.log_test("User Login", False, "Login failed", response)
            return False

    def test_get_current_user(self):
        """Test getting current user info with token"""
        if not self.admin_token:
            self.log_test("Get Current User", False, "No admin token available")
            return False
            
        success, response = self.make_request("GET", "auth/me", token=self.admin_token)
        
        if success and "email" in response:
            self.log_test("Get Current User", True, f"Retrieved user: {response['email']}")
            return True
        else:
            self.log_test("Get Current User", False, "Failed to get user info", response)
            return False

    def test_create_category_admin(self):
        """Test creating category as admin"""
        if not self.admin_token:
            self.log_test("Create Category (Admin)", False, "No admin token available")
            return False
            
        test_data = {"name": f"Test Category {datetime.now().strftime('%H%M%S')}"}
        
        success, response = self.make_request("POST", "categories", test_data, self.admin_token, expected_status=200)
        
        if success and "id" in response:
            self.created_category_id = response["id"]
            self.log_test("Create Category (Admin)", True, f"Category created: {response['name']}")
            return True
        else:
            self.log_test("Create Category (Admin)", False, "Failed to create category", response)
            return False

    def test_get_categories(self):
        """Test getting all categories"""
        success, response = self.make_request("GET", "categories")
        
        if success and isinstance(response, list):
            self.log_test("Get Categories", True, f"Retrieved {len(response)} categories")
            return True
        else:
            self.log_test("Get Categories", False, "Failed to get categories", response)
            return False

    def test_create_subcategory_admin(self):
        """Test creating subcategory as admin"""
        if not self.admin_token or not self.created_category_id:
            self.log_test("Create Sub-category (Admin)", False, "No admin token or category ID available")
            return False
            
        test_data = {
            "name": f"Test Subcategory {datetime.now().strftime('%H%M%S')}",
            "category_id": self.created_category_id
        }
        
        success, response = self.make_request("POST", "subcategories", test_data, self.admin_token, expected_status=200)
        
        if success and "id" in response:
            self.created_subcategory_id = response["id"]
            self.log_test("Create Sub-category (Admin)", True, f"Subcategory created: {response['name']}")
            return True
        else:
            self.log_test("Create Sub-category (Admin)", False, "Failed to create subcategory", response)
            return False

    def test_get_subcategories(self):
        """Test getting all subcategories"""
        success, response = self.make_request("GET", "subcategories")
        
        if success and isinstance(response, list):
            self.log_test("Get Sub-categories", True, f"Retrieved {len(response)} subcategories")
            return True
        else:
            self.log_test("Get Sub-categories", False, "Failed to get subcategories", response)
            return False

    def test_create_product_admin(self):
        """Test creating product as admin"""
        if not self.admin_token or not self.created_category_id or not self.created_subcategory_id:
            self.log_test("Create Product (Admin)", False, "Missing required data (token, category, subcategory)")
            return False
            
        test_data = {
            "sku": f"TEST-SKU-{datetime.now().strftime('%H%M%S')}",
            "photo": "https://images.pexels.com/photos/7147460/pexels-photo-7147460.jpeg",
            "category_id": self.created_category_id,
            "sub_category_id": self.created_subcategory_id,
            "embroidery": True,
            "jacquard": False
        }
        
        success, response = self.make_request("POST", "products", test_data, self.admin_token, expected_status=200)
        
        if success and "id" in response:
            self.created_product_id = response["id"]
            self.log_test("Create Product (Admin)", True, f"Product created: {response['sku']}")
            return True
        else:
            self.log_test("Create Product (Admin)", False, "Failed to create product", response)
            return False

    def test_get_products_with_filters(self):
        """Test getting products with various filters"""
        # Test basic get
        success, response = self.make_request("GET", "products")
        
        if success and isinstance(response, list):
            self.log_test("Get Products", True, f"Retrieved {len(response)} products")
            
            # Test with filters if we have data
            if self.created_category_id:
                success2, response2 = self.make_request("GET", f"products?category_id={self.created_category_id}")
                if success2:
                    self.log_test("Get Products with Category Filter", True, f"Filtered products: {len(response2)}")
                else:
                    self.log_test("Get Products with Category Filter", False, "Filter failed", response2)
            
            return True
        else:
            self.log_test("Get Products", False, "Failed to get products", response)
            return False

    def test_update_product_admin(self):
        """Test updating product as admin"""
        if not self.admin_token or not self.created_product_id:
            self.log_test("Update Product (Admin)", False, "No admin token or product ID available")
            return False
            
        update_data = {
            "embroidery": False,
            "jacquard": True
        }
        
        success, response = self.make_request("PUT", f"products/{self.created_product_id}", update_data, self.admin_token)
        
        if success and "id" in response:
            self.log_test("Update Product (Admin)", True, f"Product updated: {response['sku']}")
            return True
        else:
            self.log_test("Update Product (Admin)", False, "Failed to update product", response)
            return False

    def test_delete_product_admin(self):
        """Test deleting product as admin"""
        if not self.admin_token or not self.created_product_id:
            self.log_test("Delete Product (Admin)", False, "No admin token or product ID available")
            return False
            
        success, response = self.make_request("DELETE", f"products/{self.created_product_id}", token=self.admin_token)
        
        if success:
            self.log_test("Delete Product (Admin)", True, "Product deleted successfully")
            return True
        else:
            self.log_test("Delete Product (Admin)", False, "Failed to delete product", response)
            return False

    def test_get_stats_admin(self):
        """Test getting stats as admin"""
        if not self.admin_token:
            self.log_test("Get Stats (Admin)", False, "No admin token available")
            return False
            
        success, response = self.make_request("GET", "stats", token=self.admin_token)
        
        if success and "products" in response:
            self.log_test("Get Stats (Admin)", True, f"Stats retrieved: {response}")
            return True
        else:
            self.log_test("Get Stats (Admin)", False, "Failed to get stats", response)
            return False

    def test_role_based_access_user_cannot_create_products(self):
        """Test that regular user cannot create products"""
        if not self.user_token or not self.created_category_id or not self.created_subcategory_id:
            self.log_test("Role-based Access - User Cannot Create Products", False, "Missing user token or test data")
            return False
            
        test_data = {
            "sku": f"UNAUTHORIZED-{datetime.now().strftime('%H%M%S')}",
            "photo": "https://example.com/test.jpg",
            "category_id": self.created_category_id,
            "sub_category_id": self.created_subcategory_id,
            "embroidery": False,
            "jacquard": False
        }
        
        success, response = self.make_request("POST", "products", test_data, self.user_token, expected_status=403)
        
        if success:  # Success means we got 403 as expected
            self.log_test("Role-based Access - User Cannot Create Products", True, "User correctly denied access")
            return True
        else:
            self.log_test("Role-based Access - User Cannot Create Products", False, "User was able to create product (security issue)", response)
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Product Management API Tests")
        print(f"📍 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📋 Authentication Tests")
        self.test_user_registration_admin()
        self.test_user_registration_user()
        self.test_user_login()
        self.test_get_current_user()
        
        # Category Tests
        print("\n📋 Category Management Tests")
        self.test_create_category_admin()
        self.test_get_categories()
        
        # Subcategory Tests
        print("\n📋 Sub-category Management Tests")
        self.test_create_subcategory_admin()
        self.test_get_subcategories()
        
        # Product Tests
        print("\n📋 Product Management Tests")
        self.test_create_product_admin()
        self.test_get_products_with_filters()
        self.test_update_product_admin()
        
        # Stats Tests
        print("\n📋 Admin Stats Tests")
        self.test_get_stats_admin()
        
        # Role-based Access Tests
        print("\n📋 Role-based Access Control Tests")
        self.test_role_based_access_user_cannot_create_products()
        
        # Cleanup Tests
        print("\n📋 Cleanup Tests")
        self.test_delete_product_admin()
        
        # Print Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ProductManagementAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())