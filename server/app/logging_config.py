import logging
import sys


def setup_logging():
    """
    Configures logging for the application.

    This can be called by both the main FastAPI app and standalone scripts
    to ensure consistent logging behavior. It logs to stdout, which is
    a best practice for applications that might be run in containers.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
    )
