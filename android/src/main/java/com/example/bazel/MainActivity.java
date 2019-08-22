package com.example.bazel;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Base64;
import android.util.JsonReader;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

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

  private void send(String message) {
    logger.info("Sending to JS: " + message);
    webView.post(() -> webView.evaluateJavascript(String.format("window.ShellApi.receive(%s);", message), null));
  }

  @JavascriptInterface
  public void receive(String json) throws JSONException {
    JSONObject obj = new JSONObject(json);
    String message = obj.getString("message");
    logger.info("Java received message: " + message);
    switch (message) {
      case "ready":
        send("{\"message\": \"spawn\", \"recipe\": \"Notification\"}");
        break;
      case "slot":
        if (obj.isNull("content")) {
          break;
        }
        JSONObject content = obj.getJSONObject("content");
        if (content.isNull("model")) {
          break;
        }
        JSONObject model = content.getJSONObject("model");
        if (model.isNull("modality")) {
          break;
        }
        String modality = model.getString("modality");
        processModality(modality, model);
        break;
      default:
        logger.info("Got unhandled message of type: " + message);
        break;
    }
  }

  private void processModality(String modality, JSONObject model) throws JSONException {
    switch (modality) {
      case "notification":
        String text = model.getString("text");
        Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
        break;
      default:
        throw new RuntimeException("Unknown modality: " + modality);
    }
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
    webView.post(() -> {
      webView.evaluateJavascript("window.DeviceClient = { receive(json) { Android.receive(json); } };", null);
      webView.evaluateJavascript("window.startTheShell();", null);
    });
  }
}
