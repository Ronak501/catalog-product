from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"  # "admin" or "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    created_at: str

class SubCategoryCreate(BaseModel):
    name: str
    category_id: str

class SubCategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category_id: str
    category_name: Optional[str] = None
    created_at: str

class ProductCreate(BaseModel):
    sku: str
    photo: str
    category_id: str
    sub_category_id: str
    embroidery: bool = False
    jacquard: bool = False

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    photo: Optional[str] = None
    category_id: Optional[str] = None
    sub_category_id: Optional[str] = None
    embroidery: Optional[bool] = None
    jacquard: Optional[bool] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sku: str
    photo: str
    category_id: str
    category_name: Optional[str] = None
    sub_category_id: str
    sub_category_name: Optional[str] = None
    embroidery: bool
    jacquard: bool
    created_at: str
    updated_at: str

class ProductFilter(BaseModel):
    category_id: Optional[str] = None
    sub_category_id: Optional[str] = None
    embroidery: Optional[bool] = None
    jacquard: Optional[bool] = None
    search: Optional[str] = None

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.role)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        created_at=now
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )

# ================== CATEGORY ROUTES ==================

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, user: dict = Depends(get_admin_user)):
    cat_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    cat_doc = {
        "id": cat_id,
        "name": data.name,
        "created_at": now
    }
    await db.categories.insert_one(cat_doc)
    return CategoryResponse(id=cat_id, name=data.name, created_at=now)

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return [CategoryResponse(**cat) for cat in categories]

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(get_admin_user)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.subcategories.delete_many({"category_id": category_id})
    return {"message": "Category deleted"}

# ================== SUB-CATEGORY ROUTES ==================

@api_router.post("/subcategories", response_model=SubCategoryResponse)
async def create_subcategory(data: SubCategoryCreate, user: dict = Depends(get_admin_user)):
    category = await db.categories.find_one({"id": data.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    sub_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    sub_doc = {
        "id": sub_id,
        "name": data.name,
        "category_id": data.category_id,
        "created_at": now
    }
    await db.subcategories.insert_one(sub_doc)
    return SubCategoryResponse(
        id=sub_id,
        name=data.name,
        category_id=data.category_id,
        category_name=category["name"],
        created_at=now
    )

@api_router.get("/subcategories", response_model=List[SubCategoryResponse])
async def get_subcategories(category_id: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    subcategories = await db.subcategories.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with category names
    for sub in subcategories:
        cat = await db.categories.find_one({"id": sub["category_id"]}, {"_id": 0})
        sub["category_name"] = cat["name"] if cat else None
    
    return [SubCategoryResponse(**sub) for sub in subcategories]

@api_router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str, user: dict = Depends(get_admin_user)):
    result = await db.subcategories.delete_one({"id": subcategory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-category not found")
    return {"message": "Sub-category deleted"}

# ================== PRODUCT ROUTES ==================

@api_router.post("/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, user: dict = Depends(get_admin_user)):
    # Validate category and subcategory
    category = await db.categories.find_one({"id": data.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    subcategory = await db.subcategories.find_one({"id": data.sub_category_id}, {"_id": 0})
    if not subcategory:
        raise HTTPException(status_code=404, detail="Sub-category not found")
    
    # Check SKU uniqueness
    existing = await db.products.find_one({"sku": data.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    prod_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    prod_doc = {
        "id": prod_id,
        "sku": data.sku,
        "photo": data.photo,
        "category_id": data.category_id,
        "sub_category_id": data.sub_category_id,
        "embroidery": data.embroidery,
        "jacquard": data.jacquard,
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(prod_doc)
    
    return ProductResponse(
        id=prod_id,
        sku=data.sku,
        photo=data.photo,
        category_id=data.category_id,
        category_name=category["name"],
        sub_category_id=data.sub_category_id,
        sub_category_name=subcategory["name"],
        embroidery=data.embroidery,
        jacquard=data.jacquard,
        created_at=now,
        updated_at=now
    )

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    sub_category_id: Optional[str] = None,
    embroidery: Optional[bool] = None,
    jacquard: Optional[bool] = None,
    search: Optional[str] = None
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if sub_category_id:
        query["sub_category_id"] = sub_category_id
    if embroidery is not None:
        query["embroidery"] = embroidery
    if jacquard is not None:
        query["jacquard"] = jacquard
    if search:
        query["sku"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with category/subcategory names
    for prod in products:
        cat = await db.categories.find_one({"id": prod["category_id"]}, {"_id": 0})
        sub = await db.subcategories.find_one({"id": prod["sub_category_id"]}, {"_id": 0})
        prod["category_name"] = cat["name"] if cat else None
        prod["sub_category_name"] = sub["name"] if sub else None
    
    return [ProductResponse(**prod) for prod in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cat = await db.categories.find_one({"id": product["category_id"]}, {"_id": 0})
    sub = await db.subcategories.find_one({"id": product["sub_category_id"]}, {"_id": 0})
    product["category_name"] = cat["name"] if cat else None
    product["sub_category_name"] = sub["name"] if sub else None
    
    return ProductResponse(**product)

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, user: dict = Depends(get_admin_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Validate SKU uniqueness if updating
    if "sku" in update_data and update_data["sku"] != product["sku"]:
        existing = await db.products.find_one({"sku": update_data["sku"]})
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    
    # Validate category if updating
    if "category_id" in update_data:
        cat = await db.categories.find_one({"id": update_data["category_id"]})
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Validate subcategory if updating
    if "sub_category_id" in update_data:
        sub = await db.subcategories.find_one({"id": update_data["sub_category_id"]})
        if not sub:
            raise HTTPException(status_code=404, detail="Sub-category not found")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Return updated product
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    cat = await db.categories.find_one({"id": updated["category_id"]}, {"_id": 0})
    sub = await db.subcategories.find_one({"id": updated["sub_category_id"]}, {"_id": 0})
    updated["category_name"] = cat["name"] if cat else None
    updated["sub_category_name"] = sub["name"] if sub else None
    
    return ProductResponse(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ================== STATS ROUTE ==================

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_admin_user)):
    products_count = await db.products.count_documents({})
    categories_count = await db.categories.count_documents({})
    subcategories_count = await db.subcategories.count_documents({})
    users_count = await db.users.count_documents({})
    embroidery_count = await db.products.count_documents({"embroidery": True})
    jacquard_count = await db.products.count_documents({"jacquard": True})
    
    return {
        "products": products_count,
        "categories": categories_count,
        "subcategories": subcategories_count,
        "users": users_count,
        "embroidery_products": embroidery_count,
        "jacquard_products": jacquard_count
    }

# ================== ROOT ==================

@api_router.get("/")
async def root():
    return {"message": "Product Management API"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
