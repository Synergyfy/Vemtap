const apiKey = "AIzaSyBXs8g2rez5HhiQvJG4n07qo-yNYiaAq6w";

async function test() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.models.map(m => m.name).join("\n"));
  } catch (error) {
    console.error("ERROR", error);
  }
}

test();
