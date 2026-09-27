"""Run the preserved general suite and the new Kids regressions, including live Pages."""
import pathlib
import subprocess
import sys

root = pathlib.Path(__file__).parent
for suite in ('browser_legacy.py', 'kids_browser.py'):
    subprocess.run([sys.executable, str(root / suite)], check=True)
