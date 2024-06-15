import Bun from "bun";

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;
  

    if (path === "/auth" && req.method == "POST") {
      try {
        const body = await req.json();
        console.log(body)
        const reponse = new Response(JSON.stringify(body), {
          status:200,
          headers: {
            "Content-Type": "application/json",
          },
        });

        return reponse
      } catch (error) {
        return new Response("Failed to fetch data from TG", {status: 500})
      }
    }

    // Handle POST request to /echo
    if (path === "/echo" && req.method === "POST") {
      try {
        const body = await req.json(); // Parse request body as JSON
        console.log("Received JSON:", body);
        const { secret, receiver } = body; // Destructure properties from body
  
        // Echo back the received JSON
        const response = new Response(JSON.stringify(body), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        return response;
      } catch (error) {
        console.error("Error processing request:", error);
        return new Response("Failed to process request", { status: 500 });
      }
    }  

    // Respond with other routes
    if (path === "/") {
      return new Response("Welcome to Bun!");
    }

    // Handle other routes or return 404
    return new Response("Page not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
