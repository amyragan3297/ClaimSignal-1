# This file is a placeholder for workflow compatibility
# The actual application runs via npm run dev
import subprocess
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")
sys.exit(subprocess.call(["npm", "run", "dev"]))
