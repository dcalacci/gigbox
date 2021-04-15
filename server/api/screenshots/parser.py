import numpy as np
import cv2
import os
import random
from PIL import Image
from api.models import EmployerNames
import pytesseract


def predict_app(image_text):
    # TODO: implement layoutLM pipeline for classification
    if "instacart" in image_text.lower():
        return EmployerNames.INSTACART
    elif "Shop" in image_text.lower():
        return EmployerNames.SHIPT
    else:
        return EmployerNames.DOORDASH


def image_to_df(image):
    # image = image_from_file(file)
    i = Image.fromarray(image)
    width, height = i.size
    w_scale = 1000 / width
    h_scale = 1000 / height

    ocr_df = pytesseract.image_to_data(
        i, output_type="data.frame", config="--psm 6")
    ocr_df = ocr_df.dropna().assign(
        left_scaled=ocr_df.left * w_scale,
        width_scaled=ocr_df.width * w_scale,
        top_scaled=ocr_df.top * h_scale,
        height_scaled=ocr_df.height * h_scale,
        right_scaled=lambda x: x.left_scaled + x.width_scaled,
        bottom_scaled=lambda x: x.top_scaled + x.height_scaled,
    )

    # 4/14/21 - not sure why we used this to transform float into int.
    # int...should check when testing full OCR pipeline.
    # float_cols = ocr_df.select_dtypes("float").columns
    # ocr_df[float_cols] = ocr_df[float_cols].round(0).astype(int)
    return ocr_df


def parse_image(image):
    # image = image_from_file(file)
    # gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    filename = "/tmp/{}.png".format(os.getpid() + random.randint(1, 100))
    # cv2.imwrite(filename, gray)
    print("cv2 parsed image:", gray)
    text = pytesseract.image_to_string(gray, config="--psm 6")
    df = image_to_df(gray)
    return text


def image_from_file(file):
    f_array = np.asarray(bytearray(file.read()))
    image = cv2.imdecode(f_array, 0)
    return image
