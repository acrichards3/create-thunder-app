// ext-fetch-shim.js
// Intercepts /api/* fetch calls and routes them via postMessage to the extension host.
// Must be loaded BEFORE app.js in the webview.

(function () {
  var originalFetch = window.fetch.bind(window);
  var requestId = 0;
  var pending = {};

  // Listen for responses from the extension host
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "api-response") return;
    var pending_1 = pending[data.requestId];
    if (pending_1) {
      clearTimeout(pending_1.timeout);
      delete pending[data.requestId];
      try {
        var response = new Response(data.body, {
          status: data.ok ? 200 : 500,
          statusText: data.ok ? "OK" : "Error",
          headers: { "Content-Type": "application/json" },
        });
        pending_1.resolve(response);
      } catch (err) {
        pending_1.reject(err);
      }
    }
  });

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url;
    // Only intercept relative /api/* requests
    if (url && url.startsWith("/api/")) {
      var id = String(++requestId);
      var method = (init && init.method) || "GET";
      var body = init && init.body ? String(init.body) : undefined;
      return new Promise(function (resolve, reject) {
        pending[id] = {
          resolve: resolve,
          reject: reject,
          timeout: setTimeout(function () {
            delete pending[id];
            reject(new Error("Extension API request timeout: " + url));
          }, 30000),
        };
        window.parent.postMessage(
          {
            type: "api-request",
            requestId: id,
            method: method,
            url: url,
            body: body,
          },
          "*",
        );
      });
    }
    // Pass through all other requests
    return originalFetch(input, init);
  };
})();
