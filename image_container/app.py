from PIL import Image, ImageDraw
from PIL import ImageFont
from io import BytesIO
import base64


def handler(event, context):
    print(event)

    data = {
        "user_name": "username",
        "exp": {
            "読書": {"total": 155, "proceed": 10},
            "開発": {"total": 11, "proceed": 1},
            "コミュ": {"total": 102, "proceed": 100},
        },
    }

    im = Image.new("RGB", (480, 270), (256, 256, 256))
    draw = ImageDraw.Draw(im)

    font_size = 40
    font = ImageFont.truetype("DotGothic16/DotGothic16-Regular.ttf", font_size)

    draw.text((0, 0), f"@{data['user_name']}", (0, 0, 0), font=font)

    gap = font_size + 10
    for i, (k, v) in enumerate(data["exp"].items()):
        draw.text(
            (0, (i + 1) * gap),
            f"{k}: {v['total']}pts (+{v['proceed']})",
            (0, 0, 0),
            font=font,
        )

    # im.save("image.png")

    buffer = BytesIO()
    im.save(buffer, format="png")
    img_str = base64.b64encode(buffer.getvalue()).decode("ascii")

    # img_tag = f'<img src="data:image/jpeg;base64,{img_str}">'
    return {"statusCode": 200, "body": img_str}


if __name__ == "__main__":
    handler("", "")
