package com.example.bazel;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Main class for the Bazel Android "Hello, World" app.
 */
public class MainActivity extends Activity {
  @SuppressLint("SetJavaScriptEnabled")
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView webView = new WebView(this);
    setContentView(webView);

    webView.getSettings().setJavaScriptEnabled(true);
    webView.addJavascriptInterface(new WebAppInterface(this), "Android");

    String unencodedHtml =
        "<input type=\"button\" value=\"Say hello\" onClick=\"Android.showToast('Hello Android!')\" />";
    String encodedHtml = Base64.encodeToString(unencodedHtml.getBytes(),
            Base64.NO_PADDING);
    webView.loadData(encodedHtml, "text/html", "base64");
  }

  private static class WebAppInterface {
    Context context;

    /** Instantiate the interface and set the context */
    WebAppInterface(Context c) {
      context = c;
    }

    /** Show a toast from the web page */
    @JavascriptInterface
    public void showToast(String toast) {
      Toast.makeText(context, toast, Toast.LENGTH_SHORT).show();
    }
  }
}
