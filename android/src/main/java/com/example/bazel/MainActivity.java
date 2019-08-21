package com.example.bazel;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import java.util.logging.Logger;

/**
 * Main class for the Bazel Android "Hello, World" app.
 */
public class MainActivity extends Activity {

  private static final Logger logger = Logger.getLogger(MainActivity.class.getName());

  private WebView webView;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    webView = new WebView(this);
    setContentView(webView);

    WebSettings settings = webView.getSettings();
    settings.setDatabaseEnabled(true);
    settings.setGeolocationEnabled(true);
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSafeBrowsingEnabled(false);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
    WebView.setWebContentsDebuggingEnabled(true);
    webView.addJavascriptInterface(this, "Android");

    webView.loadUrl("file:///android_asset/pipes_shell_dist/index.html?log");
  }

  /** Show a toast from the web page */
  @JavascriptInterface
  public void showToast(String toast) {
    Toast.makeText(this, toast, Toast.LENGTH_SHORT).show();
  }

  /** Called when the WebView is ready. */
  @JavascriptInterface
  public void onLoad() {
    logger.info("onLoad called");
    webView.post(() -> webView.evaluateJavascript("abc(111)", res -> logger.info("Result from JS was: " + res)));
  }
}
