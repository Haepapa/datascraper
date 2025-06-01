import random
import string
from datetime import datetime

def generate_filename() -> str:
    """Generates a timestamped filename with a random suffix."""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rand_part = "-".join(
        ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        for _ in range(3)
    )
    return f"{timestamp}-{rand_part}.txt"