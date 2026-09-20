"""Security, password hashing, and JWT token management."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db

# HTTP Bearer authentication scheme
security_scheme = HTTPBearer(auto_error=False)

PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS
    )
    return f"$pbkdf2${PBKDF2_ITERATIONS}${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password, supporting PBKDF2 and legacy fallback."""
    if not hashed_password:
        return False

    if hashed_password.startswith("$pbkdf2$"):
        parts = hashed_password.split("$")
        if len(parts) == 5:
            _, _, iters_str, salt, target_hash = parts
            try:
                iters = int(iters_str)
                dk = hashlib.pbkdf2_hmac(
                    "sha256",
                    plain_password.encode("utf-8"),
                    salt.encode("utf-8"),
                    iters
                )
                return hmac.compare_digest(dk.hex(), target_hash)
            except Exception:
                return False

    # Backward compatibility with legacy sha256(password + salt)
    legacy_salt = settings.SECRET_KEY[:16]
    legacy_hash = hashlib.sha256((plain_password + legacy_salt).encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, hashed_password)


def create_access_token(
    subject: Union[str, int, Any],
    expires_delta: Optional[timedelta] = None,
    claims: Optional[Dict[str, Any]] = None
) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {"exp": expire, "sub": str(subject)}
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token returning payload dict."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    """FastAPI dependency to validate JWT bearer token and return authenticated User."""
    from backend.app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not auth or not auth.credentials:
        raise credentials_exception

    payload = decode_access_token(auth.credentials)
    if not payload:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
    except ValueError:
        # If sub is email
        user = db.query(User).filter(User.email == user_id_str).first()

    if not user:
        raise credentials_exception

    return user


def require_role(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_roles}"
            )
        return current_user
    return role_checker
