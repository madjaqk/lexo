import datetime

from pydantic import ConfigDict, TypeAdapter
from pydantic.alias_generators import to_camel
from sqlalchemy import JSON, Column
from sqlalchemy.orm import reconstructor
from sqlmodel import Field, SQLModel


class CamelCaseBaseModel(SQLModel):
    """A base model that converts snake_case to camelCase for JSON compatibility."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )  # type: ignore
    # SQLModel expects this to be SQLModelConfig, which is ConfigDict plus a few optional fields, so using just a ConfigDict works just fine in practice.  On the other hand, I couldn't figure out where to import SQLModelConfig from, so I couldn't use it directly.--JDB 2025-08-09


class Tile(CamelCaseBaseModel):
    id: str
    letter: str
    value: int


class Puzzle(CamelCaseBaseModel):
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


class GameRules(CamelCaseBaseModel):
    """Pydantic model for the game rules configuration."""

    multipliers: dict[int, int]
    letter_values: dict[str, int]
    timer_seconds: int
