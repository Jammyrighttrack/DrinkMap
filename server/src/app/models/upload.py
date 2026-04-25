from pydantic import BaseModel

class CloudinarySignature(BaseModel):
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str
