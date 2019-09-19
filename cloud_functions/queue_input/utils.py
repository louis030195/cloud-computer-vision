
import requests

def get_no_response(url):
    """
    Get request without waiting any response (not really need any and it causes timeout)
    # https://stackoverflow.com/questions/27021440/python-requests-dont-wait-for-request-to-finish
    """
    try:
        requests.get(url, timeout = 2)
    except requests.exceptions.ReadTimeout:
        pass