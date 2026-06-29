package com.julie.balatroseedsearcher;

import android.util.Log;
import android.webkit.JavascriptInterface;

/**
 * JS-to-logcat bridge so we can verify on a real device that:
 *   - crossOriginIsolated is true (COOP/COEP headers landed)
 *   - SharedArrayBuffer exists
 *   - navigator.hardwareConcurrency is what we expect
 *   - the orchestrator picked 'threaded' and not the N-worker fallback
 *
 * Call from JS: window.AndroidDebug.log("isolated", String(crossOriginIsolated))
 *
 * Then: adb logcat -s BalatroSeed
 */
public class DebugLogger {
    private static final String TAG = "BalatroSeed";

    @JavascriptInterface
    public void log(String key, String value) {
        Log.i(TAG, key + "=" + value);
    }

    @JavascriptInterface
    public void warn(String key, String value) {
        Log.w(TAG, key + "=" + value);
    }

    @JavascriptInterface
    public void bench(String label, double ms, long seeds) {
        Log.i(TAG, "bench label=" + label + " ms=" + ms + " seeds=" + seeds
                + " seeds_per_sec=" + (seeds * 1000.0 / Math.max(ms, 1.0)));
    }
}
