import os
import qrcode
from PIL import Image
from config import Config

def generate_qr_code(certificate_id, frontend_base_url=None):
    """
    Generates a high-quality QR code encoding the public certificate verification URL.
    Returns the relative path and absolute file path of the saved PNG image.
    """
    base_url = (frontend_base_url or Config.FRONTEND_BASE_URL).rstrip('/')
    verify_url = f"{base_url}/verify/{certificate_id}"

    os.makedirs(Config.GENERATED_FOLDER, exist_ok=True)
    filename = f"qr_{certificate_id}.png"
    filepath = os.path.join(Config.GENERATED_FOLDER, filename)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    img.save(filepath, format="PNG")

    return filename, filepath
