from PIL import Image
import requests
from io import BytesIO
import base64

def download_Image(url, width=None):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    # If png cast to jpeg, i don't even know if that's required
    if '.png' in url:
        img = img.convert('RGB')
    if width is not None:
        wpercent = (width / float(img.size[0]))
        hsize = int((float(img.size[1]) * float(wpercent)))
        img = img.resize((width, hsize), Image.ANTIALIAS)
    return img

def Image_to_b64(img):
    ret = BytesIO()
    img.save(ret, img.format)
    ret.seek(0)
    return base64.b64encode(ret.getvalue())