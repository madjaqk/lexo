import datetime

from sqlalchemy import JSON, Column
from sqlalchemy.orm import reconstructor
from sqlmodel import Field, SQLModel
from pydantic import TypeAdapter


class Tile(SQLModel):
    id: str
    letter: str
    value: int


class Puzzle(SQLModel):
    initial_racks: list[list[Tile]] = Field(
        sa_column=Column(JSON), description="The list of 18 tiles for the puzzle."
    )
    target_solution: list[list[Tile]] = Field(
        sa_column=Column(JSON), description="The list of tiles in the server's solution."
    )


class PuzzleWithDate(Puzzle, table=True):
    __tablename__: str = "puzzles"  # type: ignore

    date: datetime.date = Field(
        default_factory=datetime.date.today,
        primary_key=True,
        description="The date of the puzzle, serves as the primary key.",
    )


    @reconstructor
    def convert_racks_to_tile_instances(self):
        tile_adapter = TypeAdapter(Tile)
        if isinstance(self.initial_racks[0][0], dict):
            self.initial_racks = [
                [tile_adapter.validate_python(tile) for tile in rack] for rack in self.initial_racks
            ]

        if isinstance(self.target_solution[0][0], dict):
            self.target_solution = [
                [tile_adapter.validate_python(tile) for tile in rack]
                for rack in self.target_solution
            ]
