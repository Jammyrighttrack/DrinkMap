from pydantic import BaseModel


class CloudinarySignature(BaseModel):
    """
    Contract trả về cho Frontend sau khi Backend tạo chữ ký Cloudinary.
    Frontend dùng các trường này để upload ảnh trực tiếp lên Cloudinary
    mà không cần truyền API Secret qua trình duyệt.
    """
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str
