"""Import shim: Python can't import hyphenated filenames directly.
Replaces itself in sys.modules with the real ds-agent module so that
`da.MODEL = x` in ds-swarm.py propagates correctly."""
import importlib.util
import pathlib
import sys

_path = pathlib.Path(__file__).parent / "ds-agent.py"
_spec = importlib.util.spec_from_file_location("ds_agent", _path)
_mod = importlib.util.module_from_spec(_spec)
sys.modules["ds_agent"] = _mod  # replace shim with real module
_spec.loader.exec_module(_mod)
