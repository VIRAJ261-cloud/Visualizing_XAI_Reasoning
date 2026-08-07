from datetime import datetime, timedelta,timezone
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

#Password hashing here 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") 

# JWT configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str):
    print(password)
    print(len(password.encode("utf-8")))
    return pwd_context.hash(password)



def verify_password(
    plain_password: str,
    hashed_password: str
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )



def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })


    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=ALGORITHM
    )

    return token



def verify_token(token: str):

    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[ALGORITHM]
    )

    return payload