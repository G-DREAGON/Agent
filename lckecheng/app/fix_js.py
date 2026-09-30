import pathlib
p = pathlib.Path(r"D:\lckecheng\app\static\js\app.js")
c = p.read_text("utf-8")

old = """    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(API_BASE + "/oss/upload", {
      method: "POST",
      body: formData,
    });"""

new = """    const uploadRes = await fetch(API_BASE + "/oss/upload", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });"""

c = c.replace(old, new)
p.write_text(c, "utf-8")
print("Done")
