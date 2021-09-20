import base64
from io import BytesIO
import json
import os
from PIL import Image, ImageDraw
from PIL import ImageFont
import tweepy
from tweepy import API


def handler(event, context):
    payload = event["body"]
    print(payload)

    data = json.loads(payload)
    im = Image.new("RGB", (480, 270), (256, 256, 256))
    draw = ImageDraw.Draw(im)

    font_size = 30
    font = ImageFont.truetype("DotGothic16/DotGothic16-Regular.ttf", font_size)

    draw.text((0, 0), f"@{data['user_name']}", (0, 0, 0), font=font)

    gap = int(font_size * 1.25)
    for i, (k, v) in enumerate(data["exp"].items()):
        draw.text(
            (0, (i + 1) * gap),
            f"{k}: {v['total']}pts (+{v['proceed']})",
            (0, 0, 0),
            font=font,
        )

    buffer = BytesIO()
    im.save(buffer, format="png")
    im.save("/tmp/tmp.png")
    img_str = base64.b64encode(buffer.getvalue()).decode("ascii")

    # api_key = os.environ["API_KEY"]
    # api_key_secret = os.environ["API_KEY_SECRET"]

    # auth = tweepy.OAuthHandler(api_key, api_key_secret)
    # auth.set_access_token(data["access_token"], data["access_token_secret"])

    # api: API = tweepy.API(auth)
    # res = api.media_upload("/tmp/tmp.png")
    # print(res)
    # print(res.media_id)

    # res = api.update_status(status="本日の成果です。", media_ids=[res.media_id])
    # print(res)

    return {"statusCode": 200, "body": img_str}


if __name__ == "__main__":
    handler("", "")
