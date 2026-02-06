import subprocess, os, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")

subprocess.run(["npx", "pm2", "delete", "server"], capture_output=True)

result = subprocess.run(
    ["npx", "pm2", "start", "npx", "--name", "server", "--", "tsx", "server/index.ts"],
    env={**os.environ, "NODE_ENV": "development"},
    capture_output=True, text=True
)
print(result.stdout)
print(result.stderr)

import time, socket
for i in range(30):
    time.sleep(1)
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.settimeout(1)
        s.connect(("127.0.0.1", 5000))
        s.close()
        print("Server is running on port 5000")
        sys.exit(0)
    except:
        s.close()

print("Server failed to start")
sys.exit(1)
