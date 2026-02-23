import kociemba
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/solve")
async def solve(request: Request):
    print("here")
    data = await request.json()
    cube = data['cube']

    solved = kociemba.solve(cube)

    print(solved)

    return {"solution": solved}