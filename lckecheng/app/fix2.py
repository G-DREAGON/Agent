import pathlib
p = pathlib.Path(r"D:\lckecheng\app\static\js\app.js")
c = p.read_text("utf-8")

old = """    const res = await fetch(API_BASE + "/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        image_url: imageUrl || null,
        thread_id: state.activeThreadId,
      }),
    });"""

new = """    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let res;
    try {
      res = await fetch(API_BASE + "/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image_url: imageUrl || null,
          thread_id: state.activeThreadId,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }"""

c = c.replace(old, new)
p.write_text(c, "utf-8")
print("Done")
