def TimeNow() -> str:
    """Returns the current time in the format HH:MM:SS."""
    from datetime import datetime
    return datetime.now().strftime("%H:%M:%S")