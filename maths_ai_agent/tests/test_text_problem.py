import os
from graph import build_graph
import pytest

# Integration test placeholder
# We don't want to hit the API automatically during unit tests unless mocked.

def test_graph_initialization():
    app = build_graph()
    assert app is not None
