import subprocess
import os
import sys
import fcntl
import time
import signal

LOCK_FILE = "/tmp/app_server.lock"
SERVER_PID_FILE = "/tmp/app_server.pid"
MAX_PYTHON_PROCS = 3

os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")

def is_pid_alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False

def server_already_running():
    if os.path.exists(SERVER_PID_FILE):
        try:
            with open(SERVER_PID_FILE, "r") as f:
                pid = int(f.read().strip())
            if is_pid_alive(pid):
                try:
                    import urllib.request
                    resp = urllib.request.urlopen("http://localhost:5000/api/auth/team/status", timeout=2)
                    if resp.status == 200:
                        return True
                except Exception:
                    pass
        except (ValueError, OSError):
            pass
    return False

try:
    result = subprocess.run(
        ["pgrep", "-f", "python.*main.py"],
        capture_output=True, text=True, timeout=2
    )
    pids = [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]
    if len(pids) > MAX_PYTHON_PROCS:
        sys.exit(0)
except Exception:
    pass

if server_already_running():
    sys.exit(0)

lock_fd = None
try:
    lock_fd = open(LOCK_FILE, "w")
    fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    lock_fd.write(str(os.getpid()))
    lock_fd.flush()
except (IOError, OSError):
    sys.exit(0)

try:
    port_check = subprocess.run(
        ["fuser", "5000/tcp"],
        capture_output=True, text=True, timeout=2
    )
    if port_check.returncode == 0 and port_check.stdout.strip():
        subprocess.run(["fuser", "-k", "5000/tcp"], capture_output=True, timeout=3)
        time.sleep(1)
except Exception:
    pass

try:
    proc = subprocess.Popen(
        ["npx", "tsx", "server/index.ts"],
        env={**os.environ, "NODE_ENV": "development"},
        start_new_session=True
    )
    with open(SERVER_PID_FILE, "w") as f:
        f.write(str(proc.pid))

    for _ in range(30):
        time.sleep(1)
        if proc.poll() is not None:
            sys.exit(proc.returncode)
        try:
            import urllib.request
            resp = urllib.request.urlopen("http://localhost:5000/api/auth/team/status", timeout=2)
            if resp.status == 200:
                break
        except Exception:
            continue

    if lock_fd:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
            lock_fd.close()
        except Exception:
            pass
        lock_fd = None

    proc.wait()
    sys.exit(proc.returncode)
finally:
    if lock_fd:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
            lock_fd.close()
            os.unlink(LOCK_FILE)
        except Exception:
            pass
    try:
        os.unlink(SERVER_PID_FILE)
    except Exception:
        pass
