import subprocess, os, sys, socket, time

os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")

def port_in_use(port=5000):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.settimeout(1)
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except:
        s.close()
        return False

if port_in_use():
    sys.exit(0)

LOCK = "/tmp/app_server.lock"
try:
    fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    os.write(fd, str(os.getpid()).encode())
    os.close(fd)
except FileExistsError:
    try:
        with open(LOCK) as f:
            pid = int(f.read().strip())
        os.kill(pid, 0)
        sys.exit(0)
    except:
        try:
            os.unlink(LOCK)
        except:
            pass
        try:
            fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode())
            os.close(fd)
        except:
            sys.exit(0)
except:
    sys.exit(0)

child_pid = os.fork()
if child_pid > 0:
    for _ in range(30):
        time.sleep(1)
        if port_in_use():
            sys.exit(0)
    sys.exit(1)

os.setsid()

try:
    os.unlink(LOCK)
except:
    pass

with open(LOCK, "w") as f:
    f.write(str(os.getpid()))

devnull = open(os.devnull, "r")
proc = subprocess.Popen(
    ["npx", "tsx", "server/index.ts"],
    env={**os.environ, "NODE_ENV": "development"},
    stdin=devnull,
)

try:
    proc.wait()
finally:
    try:
        os.unlink(LOCK)
    except:
        pass
