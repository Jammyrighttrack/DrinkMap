import asyncio
from app.crud.userRepository import UserRepository
from app.core.database import Database
from dotenv import load_dotenv

load_dotenv()

async def main():
    await Database.connect_db()
    user = await UserRepository.get_by_email("lytruonggiang.28082005@gmail.com")
    if not user:
        print("User not found.")
    else:
        # Check if auth_provider is 'google' or missing password_hash
        print(f"ID: {user.get('id')}")
        print(f"Email: {user.get('email')}")
        print(f"Auth Provider: {user.get('auth_provider')}")
        print(f"Has password_hash: {bool(user.get('password_hash'))}")
        print(f"Is verified: {user.get('is_verified')}")

if __name__ == "__main__":
    asyncio.run(main())
