package app.balatropedia;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Hosts the Balatropedia web bundle inside Capacitor's WebView and adds
 * the COOP / COEP / CORP headers that WASM threading needs.
 *
 * <h3>Why this exists</h3>
 *
 * The seed-finder V2 engine uses {@code wasm-bindgen-rayon}, which
 * requires {@code SharedArrayBuffer}. The WebView only exposes that
 * symbol when the document is "cross-origin isolated", which requires
 * every response to carry:
 *
 * <ul>
 *   <li>{@code Cross-Origin-Opener-Policy: same-origin}</li>
 *   <li>{@code Cross-Origin-Embedder-Policy: require-corp}</li>
 *   <li>{@code Cross-Origin-Resource-Policy: same-origin} on every
 *       subresource (.js, .wasm, .css, fonts, images, ogg)</li>
 * </ul>
 *
 * Capacitor's default {@link BridgeWebViewClient} serves bundled assets
 * via the {@code WebViewLocalServer} but does NOT add these headers, so
 * {@code crossOriginIsolated} stays {@code false} and the engine falls
 * back to N-worker mode (still works, just slower).
 *
 * This subclass overrides {@link #shouldInterceptRequest} and, when the
 * upstream client returns a response, layers the three headers on top
 * before handing it back to the WebView. When upstream returns null
 * (network requests, etc.) we leave it null so the normal network path
 * still works.
 *
 * <h3>What we deliberately do NOT touch</h3>
 *
 * - We never change the response body, MIME, or status. Only headers.
 * - We do not register a custom asset loader; Capacitor's
 *   {@code https://localhost} synthetic origin is already same-origin
 *   to itself, which is all COEP requires.
 * - We do not add the {@code AndroidDebug} JS bridge here. Capacitor
 *   plugins already give the JS layer a logging path; if a logcat
 *   diagnostic is needed, a tiny custom plugin is the right home for
 *   it, not the bridge subclass.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "Balatropedia";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        webView.setWebViewClient(new IsolatedBridgeWebViewClient(this.bridge));
        Log.i(TAG, "WebViewClient installed: COOP/COEP/CORP injection active");
    }

    /**
     * Extends Capacitor's bridge client so plugins, deep links, and the
     * local server keep working, and just stamps the isolation headers
     * onto every response that goes back to the WebView.
     */
    private static final class IsolatedBridgeWebViewClient extends BridgeWebViewClient {

        IsolatedBridgeWebViewClient(com.getcapacitor.Bridge bridge) {
            super(bridge);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse upstream = super.shouldInterceptRequest(view, request);
            if (upstream == null) {
                // Capacitor doesn't have a local file for this URL —
                // it's an outbound network request. Let the WebView
                // handle it normally; no COEP stamping needed.
                return null;
            }
            return withIsolationHeaders(upstream);
        }

        private static WebResourceResponse withIsolationHeaders(WebResourceResponse upstream) {
            Map<String, String> headers = upstream.getResponseHeaders();
            if (headers == null) headers = new HashMap<>();
            else                  headers = new HashMap<>(headers);

            // The two headers that make crossOriginIsolated == true:
            headers.put("Cross-Origin-Opener-Policy", "same-origin");
            headers.put("Cross-Origin-Embedder-Policy", "require-corp");
            // Required on every subresource under COEP require-corp.
            // Everything we serve here is same-origin (bundled in the
            // APK), so this is safe.
            headers.put("Cross-Origin-Resource-Policy", "same-origin");

            // Build a fresh response carrying the original body + new
            // headers. We have to use the 6-arg constructor for headers.
            String reason = upstream.getReasonPhrase();
            if (reason == null || reason.isEmpty()) reason = "OK";
            return new WebResourceResponse(
                    upstream.getMimeType(),
                    upstream.getEncoding(),
                    upstream.getStatusCode() == 0 ? 200 : upstream.getStatusCode(),
                    reason,
                    headers,
                    upstream.getData()
            );
        }
    }
}
