import subprocess
import os
import sys
import fcntl

LOCK_FILE = "/tmp/app_server.lock"

os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")

lock_fd = None
try:
    lock_fd = open(LOCK_FILE, "w")
    fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    lock_fd.write(str(os.getpid()))
    lock_fd.flush()
except (IOError, OSError):
    sys.exit(0)

try:
    proc = subprocess.Popen(["npm", "run", "dev"])
    proc.wait()
    sys.exit(proc.returncode)
finally:
    if lock_fd:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
            lock_fd.close()
            os.unlink(LOCK_FILE)
        except:
            pass
