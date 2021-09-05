from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def read_root():
    with open("index.html") as f:
        html = f.read()

    return html

@app.get("/elm.js", response_class=HTMLResponse)
def read_root():
    with open("elm.js") as f:
        html = f.read()

    return html


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}