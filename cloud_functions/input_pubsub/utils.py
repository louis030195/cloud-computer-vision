from PIL import Image
import requests
from io import BytesIO
import base64

def download_Image(url, rescale_width=None, resize_width=None):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    # If png cast to jpeg, i don't even know if that's required
    if '.png' in url:
        img = img.convert('RGB')
    if rescale_width is not None:
        wpercent = (rescale_width / float(img.size[0]))
        hsize = int((float(img.size[1]) * float(wpercent)))
        img = img.resize((rescale_width, hsize), Image.ANTIALIAS)
    if resize_width is not None:
        img = img.resize((resize_width, resize_width), Image.ANTIALIAS)
    return img

def Image_to_b64(img):
    ret = BytesIO()
    img.save(ret, "JPEG")
    ret.seek(0)
    return base64.b64encode(ret.getvalue())