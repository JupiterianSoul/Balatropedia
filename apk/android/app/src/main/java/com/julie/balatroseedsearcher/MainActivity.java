package com.julie.balatroseedsearcher;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Hosts the Seed Searcher web bundle inside a WebView and injects the
 * COOP/COEP headers that WASM threading needs.
 *
 * <h3>Why this class is non-trivial</h3>
 *
 * The Rust engine uses {@code rayon} + {@code wasm-bindgen-rayon}, which
 * requires {@code SharedArrayBuffer}. The browser only exposes
 * {@code SharedArrayBuffer} when the document is "cross-origin
 * isolated", which in turn requires the HTML response to carry:
 *
 * <ul>
 *   <li>{@code Cross-Origin-Opener-Policy: same-origin}</li>
 *   <li>{@code Cross-Origin-Embedder-Policy: require-corp}</li>
 * </ul>
 *
 * The Android {@code WebView} does NOT add these by itself when serving
 * assets from {@code file:///android_asset/}. Without them,
 * {@code crossOriginIsolated} stays {@code false} and the engine falls
 * back to N-worker mode (which still works, just slower). The
 * {@link #serveAsset} helper below adds them to every response.
 *
 * <h3>Why we also add CORP on subresources</h3>
 *
 * When the document declares COEP require-corp, every subresource
 * (.js, .wasm, .css, .json, fonts) must declare itself
 * cross-origin-embeddable via either CORS or
 * {@code Cross-Origin-Resource-Policy: same-origin}. Same-origin is
 * fine here because everything is bundled in the APK. Without CORP the
 * resource is blocked and the page never loads.
 */
public class MainActivity extends Activity {

    private static final String TAG = "BalatroSeed";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView webView = findViewById(R.id.webview);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);              // for localStorage persistence
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);               // assets are served via shouldInterceptRequest
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Required for WebAssembly + threading
        s.setJavaScriptCanOpenWindowsAutomatically(false);

        webView.setWebViewClient(new IsolatedWebViewClient(this));

        // Bridge object so JS can log diagnostics back to logcat
        webView.addJavascriptInterface(new DebugLogger(), "AndroidDebug");

        // The base URL is what powers same-origin. Asset paths are
        // served from this synthetic origin via shouldInterceptRequest.
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    /**
     * Custom client that intercepts every request, serves the matching
     * asset out of the APK, and stamps COOP / COEP / CORP headers on
     * the response so {@code crossOriginIsolated} flips to {@code true}.
     */
    private static final class IsolatedWebViewClient extends WebViewClient {
        private final MainActivity activity;
        IsolatedWebViewClient(MainActivity activity) { this.activity = activity; }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            // Only handle our synthetic origin; everything else (analytics,
            // CDN, etc) goes through the network as usual.
            String prefix = "https://appassets.androidplatform.net/assets/";
            if (!url.startsWith(prefix)) return null;

            String path = url.substring(prefix.length());
            if (path.isEmpty() || path.endsWith("/")) path = path + "index.html";
            // Strip query/hash if any (defensive)
            int q = path.indexOf('?'); if (q >= 0) path = path.substring(0, q);
            int h = path.indexOf('#'); if (h >= 0) path = path.substring(0, h);

            try {
                return serveAsset(path);
            } catch (IOException ioe) {
                Log.w(TAG, "404 " + path);
                return new WebResourceResponse("text/plain", "utf-8",
                        404, "Not Found", null, null);
            }
        }

        private WebResourceResponse serveAsset(String path) throws IOException {
            InputStream is = activity.getAssets().open(path);
            String mime = mimeFor(path);
            String charset = mime.startsWith("text/") || mime.endsWith("/javascript")
                    || mime.endsWith("/json") || mime.endsWith("+xml") ? "utf-8" : null;

            Map<String, String> headers = new HashMap<>();
            // The two headers that make crossOriginIsolated == true:
            headers.put("Cross-Origin-Opener-Policy", "same-origin");
            headers.put("Cross-Origin-Embedder-Policy", "require-corp");
            // Required on every subresource under COEP require-corp:
            headers.put("Cross-Origin-Resource-Policy", "same-origin");
            // Long cache for hashed assets; the HTML response itself is
            // small so the cache headers don't hurt.
            if (path.contains("/assets/") || path.endsWith(".wasm")) {
                headers.put("Cache-Control", "public, max-age=31536000, immutable");
            } else {
                headers.put("Cache-Control", "no-cache");
            }

            return new WebResourceResponse(mime, charset, 200, "OK", headers, is);
        }

        private static String mimeFor(String path) {
            if (path.endsWith(".html")) return "text/html";
            if (path.endsWith(".js"))   return "application/javascript";
            if (path.endsWith(".mjs"))  return "application/javascript";
            if (path.endsWith(".wasm")) return "application/wasm";
            if (path.endsWith(".css"))  return "text/css";
            if (path.endsWith(".json")) return "application/json";
            if (path.endsWith(".svg"))  return "image/svg+xml";
            if (path.endsWith(".png"))  return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".webp")) return "image/webp";
            if (path.endsWith(".woff2")) return "font/woff2";
            if (path.endsWith(".woff"))  return "font/woff";
            if (path.endsWith(".ttf"))   return "font/ttf";
            if (path.endsWith(".ogg"))   return "audio/ogg";
            if (path.endsWith(".map"))   return "application/json";
            return "application/octet-stream";
        }
    }
}
