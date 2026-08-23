import asyncio
from app.config import settings
from app.utils.cloudinary_helper import init_cloudinary
import cloudinary.uploader

async def main():
    init_cloudinary()
    
    response = cloudinary.uploader.upload(
        b"hello test",
        public_id="studysmart/test_auth.txt",
        resource_type="raw",
        type="authenticated",
        use_filename=True,
        unique_filename=False
    )
    print("Upload response:", response)

if __name__ == "__main__":
    asyncio.run(main())
