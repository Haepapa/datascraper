import random
import string
from datetime import datetime, timezone

def generate_filename() -> str:
    """Generates a timestamped filename with a random suffix."""
    timestamp: str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    rand_part: str = "-".join(
        ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        for _ in range(3)
    )
    return f"{timestamp}-{rand_part}.txt"