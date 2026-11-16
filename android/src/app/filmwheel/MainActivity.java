package app.filmwheel;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/**
 * Film Wheel for Android: a full-screen window onto the live web app.
 * The web app does everything; this only hosts it, keeps the screen awake,
 * and hands outside links (YouTube trailers) to the right Android app.
 */
public class MainActivity extends Activity {
    private static final int BG = 0xFF0A0E2C;
    private WebView web;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        web = new WebView(this);
        web.setBackgroundColor(BG);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        // Android draws apps edge to edge; keep the page clear of the status bar, gesture bar, camera cut-out and keyboard.
        root.setOnApplyWindowInsetsListener((View v, WindowInsets insets) -> {
            Insets b = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsets.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // remembers which shared wheel this phone uses
        s.setMediaPlaybackRequiresUserGesture(false); // lets the theme song and effects play
        s.setUserAgentString(s.getUserAgentString() + " FilmWheelApp/1");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (Config.HOST.equals(uri.getHost())) return false; // the app itself stays in this window
                openOutside(uri);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                String page = "<html><body style='margin:0;background:#0a0e2c;color:#f4f5ff;font-family:sans-serif;display:flex;flex-direction:column;"
                        + "align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;box-sizing:border-box'>"
                        + "<h2>Can't reach Film Wheel</h2><p style='opacity:.7'>Check your internet connection, then try again.</p>"
                        + "<a href='" + Config.START_URL + "' style='margin-top:16px;padding:14px 28px;border-radius:99px;background:#ffc940;color:#2a1c00;"
                        + "font-weight:bold;text-decoration:none'>Try again</a></body></html>";
                view.loadDataWithBaseURL(null, page, "text/html", "utf-8", null);
            }
        });

        if (saved != null) web.restoreState(saved); else web.loadUrl(Config.START_URL);
    }

    /** Opens a link in whichever Android app handles it, so a YouTube trailer opens in the YouTube app. */
    private void openOutside(Uri uri) {
        try {
            Intent intent = "intent".equals(uri.getScheme()) ? Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);
            startActivity(intent);
        } catch (ActivityNotFoundException | java.net.URISyntaxException | SecurityException e) {
            // Nothing on the phone can open it: ignore, the app carries on.
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
