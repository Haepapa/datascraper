import random
import string
from datetime import datetime, timezone

def generate_filename() -> str:
    """
    Generates a unique filename using the current UTC timestamp and a random suffix.
    
    The filename is formatted as "YYYYMMDDHHMMSS-xxxxxx-xxxxxx-xxxxxx.txt", where each "x" is a randomly selected lowercase letter or digit.
     
    Returns:
        A string representing the generated filename.
    """
    timestamp: str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    rand_part: str = "-".join(
        ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        for _ in range(3)
    )
    return f"{timestamp}-{rand_part}.txt"