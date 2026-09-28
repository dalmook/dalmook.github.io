"""Run the original browser suite and full-category regressions on the same URL."""
import pathlib
import subprocess
import sys

root=pathlib.Path(__file__).parent
for suite in ('browser_legacy.py','categories_browser.py'):
    subprocess.run([sys.executable,str(root/suite)],check=True)
