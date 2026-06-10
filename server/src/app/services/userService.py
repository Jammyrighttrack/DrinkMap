from app.crud.userRepository import UserRepository
from app.crud.shopRepository import ShopRepository
from app.dtos.userDTO import UserResponse, UpdateProfileRequest, UpdateSettingsRequest
from app.dtos.shopDTO import ShopSummaryResponse
from pydantic import BaseModel
from typing import Optional, List
from fastapi import HTTPException

class UserProfileDTO(UserResponse):
    # Kế thừa UserResponse nhưng thêm thông tin dánh sách các quán đã lưu
    saved_shops_details: List[ShopSummaryResponse] = []

class UserService:
    @staticmethod
    async def get_or_create_google_user(email: str, full_name: str, avatar: Optional[str] = None, auth_provider: str = "google") -> UserResponse:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            import uuid
            from datetime import datetime, timezone
            user_id = str(uuid.uuid4())
            user_dict = {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "avatar": avatar,
                "auth_provider": auth_provider,
                "password_hash": "", 
                "role": "user",
                "taste_preferences": [],
                "budget_preference": None,
                "is_active": True,
                "is_verified": True,
                "saved_shops": [],
                "is_anonymous_reviews": False,
                "notify_new_shops": True,
                "notify_ai_messages": True,
                "notify_promotions": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await UserRepository.create(user_dict)
            
        user_dict.pop("_id", None)
        await UserService.enrich_user_stats(user_dict)
        return UserResponse(**user_dict)

    @staticmethod
    async def verify_email_exists(email: str) -> None:
        from email_validator import validate_email, EmailNotValidError
        import dns.resolver
        import smtplib
        import socket

        # 1. Validate syntax and domain existence / MX configuration via email-validator
        try:
            valid = validate_email(email, check_deliverability=True)
            normalized_email = valid.normalized
            domain = valid.domain
        except EmailNotValidError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Email không hợp lệ hoặc tên miền không tồn tại: {str(e)}"
            )

        # 2. Filter disposable email domains
        DISPOSABLE_DOMAINS = {
            "yopmail.com", "mailinator.com", "tempmail.com", "temp-mail.org",
            "10minutemail.com", "guerrillamail.com", "sharklasers.com",
            "getairmail.com", "dispostable.com", "boun.cr", "trashmail.com",
            "generator.email"
        }
        if domain.lower() in DISPOSABLE_DOMAINS:
            raise HTTPException(
                status_code=400,
                detail="Không chấp nhận đăng ký bằng email dùng một lần (disposable email)!"
            )

        # 3. SMTP probing (mailbox existence check)
        try:
            records = dns.resolver.resolve(domain, 'MX')
            mx_hosts = [str(r.exchange).rstrip('.') for r in records]
            mx_hosts.sort()
        except Exception:
            # Fallback to True (success) if DNS MX query fails here but email-validator deliverability succeeded
            return

        if not mx_hosts:
            raise HTTPException(
                status_code=400,
                detail="Tên miền email không có máy chủ nhận thư (MX record)!"
            )

        smtp_host = mx_hosts[0]
        try:
            server = smtplib.SMTP(timeout=3)
            server.connect(smtp_host, 25)
            server.helo(socket.gethostname())
            server.mail('verify-agent@drinkmap.com')
            code, message = server.rcpt(normalized_email)
            server.quit()

            if code == 550:
                # 550 Mailbox not found
                raise HTTPException(
                    status_code=400,
                    detail="Hộp thư email này không tồn tại!"
                )
        except HTTPException:
            raise
        except Exception:
            # Safe fallback if SMTP port 25 is blocked or times out
            return

    @staticmethod
    async def register_local_user(email: str, password: str, full_name: str) -> UserResponse:
        await UserService.verify_email_exists(email)
        user_dict = await UserRepository.get_by_email(email)
        if user_dict:
            raise HTTPException(status_code=400, detail="Email này đã được đăng ký!")
            
        import uuid
        import random
        import threading
        from datetime import datetime, timezone, timedelta
        from app.core.auth import get_password_hash
        
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(password)
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        new_user = {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "avatar": None,
            "auth_provider": "local",
            "password_hash": hashed_password,
            "role": "user",
            "taste_preferences": [],
            "budget_preference": None,
            "is_active": True,
            "is_verified": False,
            "verification_code": otp_code,
            "verification_expires_at": expires_at.isoformat(),
            "saved_shops": [],
            "is_anonymous_reviews": False,
            "notify_new_shops": True,
            "notify_ai_messages": True,
            "notify_promotions": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await UserRepository.create(new_user)
        
        # Send OTP code in a background thread
        threading.Thread(target=UserService.send_otp_email, args=(email, otp_code), daemon=True).start()

        new_user.pop("_id", None)
        new_user.pop("password_hash", None)
        await UserService.enrich_user_stats(new_user)
        return UserResponse(**new_user)

    @staticmethod
    def send_otp_email(email: str, otp_code: str) -> None:
        import os
        import smtplib
        from email.mime.text import MIMEText
        from email.header import Header

        # 1. Print a beautiful console banner
        print("\n" + "=" * 60)
        print(f"               [DRINKMAP EMAIL VERIFICATION OTP]")
        print(f"  To:       {email}")
        print(f"  OTP Code: {otp_code}")
        print(f"  Expires:  In 10 minutes")
        print("=" * 60 + "\n")

        # 2. Attempt to send real SMTP email if configured
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port_str = os.getenv("SMTP_PORT", "587")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_sender = os.getenv("SMTP_SENDER", smtp_user)

        if smtp_host and smtp_user and smtp_password:
            try:
                smtp_port = int(smtp_port_str)
                msg = MIMEText(
                    f"Chào bạn,\n\nMã xác thực OTP của bạn tại DrinkMap là: {otp_code}\n"
                    "Mã này có hiệu lực trong vòng 10 phút.\n\n"
                    "Cảm ơn bạn đã tham gia DrinkMap!",
                    "plain",
                    "utf-8"
                )
                msg["Subject"] = Header("Mã xác thực OTP tài khoản DrinkMap", "utf-8")
                msg["From"] = smtp_sender
                msg["To"] = email

                if smtp_port == 465:
                    server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                    server.starttls()

                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_sender, [email], msg.as_string())
                server.quit()
                print(f"[SMTP] Email verification sent successfully to {email}")
            except Exception as e:
                print(f"[SMTP ERROR] Failed to send email via SMTP: {str(e)}")

    @staticmethod
    async def verify_otp(email: str, otp_code: str) -> dict:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản!")

        if user_dict.get("is_verified"):
            return user_dict

        saved_code = user_dict.get("verification_code")
        expires_str = user_dict.get("verification_expires_at")

        if not saved_code or not expires_str:
            raise HTTPException(status_code=400, detail="Mã xác thực không hợp lệ hoặc đã hết hạn!")

        from datetime import datetime, timezone
        expires_at = datetime.fromisoformat(expires_str)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Mã xác thực đã hết hạn! Vui lòng yêu cầu mã mới.")

        if saved_code != otp_code:
            raise HTTPException(status_code=400, detail="Mã xác thực không chính xác!")

        # Update user status to verified
        await UserRepository.update(user_dict["id"], {
            "is_verified": True,
            "verification_code": None,
            "verification_expires_at": None
        })

        # Fetch updated user info
        updated_user = await UserRepository.get_by_id(user_dict["id"])
        return updated_user

    @staticmethod
    async def resend_otp(email: str) -> None:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản!")

        if user_dict.get("is_verified"):
            raise HTTPException(status_code=400, detail="Tài khoản này đã được xác thực trước đó!")

        import random
        import threading
        from datetime import datetime, timezone, timedelta

        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        await UserRepository.update(user_dict["id"], {
            "verification_code": otp_code,
            "verification_expires_at": expires_at.isoformat()
        })

        # Send OTP
        threading.Thread(target=UserService.send_otp_email, args=(email, otp_code), daemon=True).start()

    @staticmethod
    async def request_password_reset(email: str) -> None:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với email này!")

        if not user_dict.get("is_verified"):
            raise HTTPException(status_code=400, detail="Tài khoản chưa được xác thực email!")

        import random
        import threading
        from datetime import datetime, timezone, timedelta

        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        await UserRepository.update(user_dict["id"], {
            "reset_password_code": otp_code,
            "reset_password_expires_at": expires_at.isoformat()
        })

        # Send OTP for reset password
        threading.Thread(target=UserService.send_reset_password_email, args=(email, otp_code), daemon=True).start()

    @staticmethod
    def send_reset_password_email(email: str, otp_code: str) -> None:
        import os
        import smtplib
        from email.mime.text import MIMEText
        from email.header import Header

        # Console banner for testing without SMTP
        print("\n" + "=" * 60)
        print(f"               [DRINKMAP FORGOT PASSWORD OTP]")
        print(f"  To:       {email}")
        print(f"  OTP Code: {otp_code}")
        print(f"  Expires:  In 10 minutes")
        print("=" * 60 + "\n")

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port_str = os.getenv("SMTP_PORT", "587")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_sender = os.getenv("SMTP_SENDER", smtp_user)

        if smtp_host and smtp_user and smtp_password:
            try:
                smtp_port = int(smtp_port_str)
                msg = MIMEText(
                    f"Chào bạn,\n\nBạn đã yêu cầu đặt lại mật khẩu cho tài khoản DrinkMap của mình.\n"
                    f"Mã xác thực OTP của bạn là: {otp_code}\n"
                    "Mã này có hiệu lực trong vòng 10 phút.\n\n"
                    "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.",
                    "plain",
                    "utf-8"
                )
                msg["Subject"] = Header("Mã xác nhận đổi mật khẩu DrinkMap", "utf-8")
                msg["From"] = smtp_sender
                msg["To"] = email

                if smtp_port == 465:
                    server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                    server.starttls()

                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_sender, [email], msg.as_string())
                server.quit()
                print(f"[SMTP] Reset password email sent successfully to {email}")
            except Exception as e:
                print(f"[SMTP ERROR] Failed to send reset password email via SMTP: {str(e)}")

    @staticmethod
    async def reset_password(email: str, otp_code: str, new_password: str) -> None:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản!")

        saved_code = user_dict.get("reset_password_code")
        expires_str = user_dict.get("reset_password_expires_at")

        if not saved_code or not expires_str:
            raise HTTPException(status_code=400, detail="Bạn chưa yêu cầu đặt lại mật khẩu!")

        from datetime import datetime, timezone
        expires_at = datetime.fromisoformat(expires_str)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Mã xác thực đã hết hạn! Vui lòng yêu cầu mã mới.")

        if saved_code != otp_code:
            raise HTTPException(status_code=400, detail="Mã xác thực không chính xác!")

        from app.core.auth import get_password_hash
        hashed_password = get_password_hash(new_password)

        # Update password and clear reset fields
        await UserRepository.update(user_dict["id"], {
            "password_hash": hashed_password,
            "reset_password_code": None,
            "reset_password_expires_at": None
        })

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            return None
        from app.core.auth import verify_password
        pwd_hash = user_dict.get("password_hash")
        if not pwd_hash or not verify_password(password, pwd_hash):
            return None
        return user_dict

    @staticmethod
    async def update_preferences(user_id: str, preferences: List[str]) -> UserResponse:
        await UserRepository.update(user_id, {"taste_preferences": preferences})
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
        user_dict.pop("_id", None)
        await UserService.enrich_user_stats(user_dict)
        return UserResponse(**user_dict)

    @staticmethod
    async def toggle_save_shop(user_id: str, shop_id: str) -> UserResponse:
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
            
        is_saved = shop_id in user_dict.get("saved_shops", [])
        await UserRepository.toggle_saved_shop(user_id, shop_id, is_saved)
        
        updated_dict = await UserRepository.get_by_id(user_id)
        updated_dict.pop("_id", None)
        await UserService.enrich_user_stats(updated_dict)
        return UserResponse(**updated_dict)

    @staticmethod
    async def get_saved_shops(user_id: str) -> List[ShopSummaryResponse]:
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            return []
        saved_ids = user_dict.get("saved_shops", [])
        if not saved_ids:
            return []
        saved_shops_dicts = await ShopRepository.get_by_ids(saved_ids)
        shops = []
        for s in saved_shops_dicts:
            s.pop("_id", None)
            cat = s.get("category")
            if isinstance(cat, str):
                s["category"] = [cat] if cat else []
            shops.append(ShopSummaryResponse(**s))
        return shops

    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[UserProfileDTO]:
        """
        Format data user, trả về DTO type-safe.
        """
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            return None
            
        user_dict.pop("password_hash", None)
        
        saved_shop_ids = user_dict.get("saved_shops", [])
        saved_shops_dto = []
        if saved_shop_ids:
            saved_shops_dicts = await ShopRepository.get_by_ids(saved_shop_ids)
            for s in saved_shops_dicts:
                s.pop("_id", None)
                cat = s.get("category")
                if isinstance(cat, str):
                    s["category"] = [cat] if cat else []
                saved_shops_dto.append(ShopSummaryResponse(**s))
            
        user_dict.pop("_id", None)
        await UserService.enrich_user_stats(user_dict)
        profile_dto = UserProfileDTO(**user_dict)
        profile_dto.saved_shops_details = saved_shops_dto
        
        return profile_dto

    @staticmethod
    async def update_profile(user_id: str, profile_data: UpdateProfileRequest) -> UserResponse:
        update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
        if update_dict:
            await UserRepository.update(user_id, update_dict)
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        user_dict.pop("_id", None)
        await UserService.enrich_user_stats(user_dict)
        return UserResponse(**user_dict)

    @staticmethod
    async def update_settings(user_id: str, settings_data: UpdateSettingsRequest) -> UserResponse:
        update_dict = {k: v for k, v in settings_data.dict().items() if v is not None}
        if update_dict:
            await UserRepository.update(user_id, update_dict)
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        user_dict.pop("_id", None)
        await UserService.enrich_user_stats(user_dict)
        return UserResponse(**user_dict)

    @staticmethod
    async def delete_user(user_id: str) -> bool:
        deleted_count = await UserRepository.delete(user_id)
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng để xóa")
        return True

    @staticmethod
    async def enrich_user_stats(user_dict: dict) -> dict:
        if not user_dict:
            return user_dict
        user_id = user_dict.get("id")
        if not user_id:
            return user_dict
            
        from app.core.database import Database
        db = Database.get_db()
        reviews_count = await db.reviews.count_documents({"user_id": user_id})
        points = reviews_count * 150
        
        if points < 150:
            level = "Thành viên mới"
        elif points < 450:
            level = "Người sành điệu"
        elif points < 1000:
            level = "Chuyên gia đồ uống"
        else:
            level = "Nhà thẩm định"
            
        user_dict["reviews_count"] = reviews_count
        user_dict["points"] = points
        user_dict["level"] = level
        return user_dict
