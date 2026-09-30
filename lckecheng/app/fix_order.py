import pathlib
p = pathlib.Path(r"D:\lckecheng\app\main.py")
c = p.read_text("utf-8")

lines = c.split("\n")
new_lines = []

# Reorder: load_dotenv must come before any app imports
env_lines = []
other_lines = []
found_env = False
for line in lines:
    if "from pathlib import Path" in line or "from dotenv import load_dotenv" in line or "env_path" in line or "load_dotenv(env_path" in line:
        env_lines.append(line)
        found_env = True
    elif found_env and line.strip() == "":
        env_lines.append(line)
        found_env = False
    else:
        other_lines.append(line)

# Rebuild: standard imports, then env loading, then app imports
result = []
for line in other_lines:
    result.append(line)
    if line.startswith("from fastapi.staticfiles import StaticFiles"):
        # Insert env loading right after this line
        result.extend(env_lines)

c = "\n".join(result)
p.write_text(c, "utf-8")
print("Done")
