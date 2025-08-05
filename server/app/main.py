from fastapi import FastAPI

app = FastAPI(title="Tile Game API")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Tile Game API!"}
