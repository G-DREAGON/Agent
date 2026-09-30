import pathlib
p = pathlib.Path(r"D:\lckecheng\app\agents\personal_chief.py")
c = p.read_text("utf-8")

old = 'connection = sqlite3.connect("../db/personal_chief.db", check_same_thread=False)'
new = 'from pathlib import Path as _Path\n_db_path = str(_Path(__file__).parent.parent / "db" / "personal_chief.db")\nconnection = sqlite3.connect(_db_path, check_same_thread=False)'

c = c.replace(old, new)
p.write_text(c, "utf-8")
print("Done")
