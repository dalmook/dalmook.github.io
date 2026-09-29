"""Run all regressions and retain diagnostics even when one suite fails."""
import pathlib
import subprocess
import sys
root=pathlib.Path(__file__).parent
results=[subprocess.run([sys.executable,str(root/suite)]).returncode
         for suite in ('browser_legacy.py','category_navigation.py','sharing_browser.py')]
sys.exit(1 if any(results) else 0)
