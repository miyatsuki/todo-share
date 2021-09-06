import pathlib
from typing import List, NamedTuple, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.responses import FileResponse, RedirectResponse
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Quest(NamedTuple):
    user_id: int
    id: int
    name: str
    proceeding: int
    total: int
    tags: List[str]


data_tsv_path = pathlib.Path("data.tsv")
data_tsv_path.touch()

data: List[Quest] = []
with open(data_tsv_path, encoding="utf-8") as f:
    for line in f:
        tsv = line.strip().split("\t")
        data.append(
            Quest(
                int(tsv[0]),
                int(tsv[1]),
                tsv[2],
                int(tsv[3]),
                int(tsv[4]),
                tsv[5:],
            )
        )


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}


@app.get("/api/quest/{user_id}")
def get_quest_status(user_id: int):
    return [
        {
            "id": d.id,
            "name": d.name,
            "proceed": d.proceeding,
            "total": d.total,
            "tags": d.tags,
        }
        for d in data
        if user_id == d.user_id
    ]
